"""Exercise actual Laravel request/approval services with independent PostgreSQL workers.

Run using run-stock-concurrency.ps1 against the isolated loopback test database.
"""
import base64
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def command(job):
    payload = base64.b64encode(json.dumps(job).encode()).decode()
    return ['php', 'artisan', 'inventory:test-concurrency', payload]

def run(job):
    result = subprocess.run(command(job), cwd=ROOT, capture_output=True, text=True, timeout=25)
    assert result.returncode == 0, result.stdout + result.stderr
    return result.stdout.strip()

def race(jobs):
    workers = [subprocess.Popen(command(job), cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True) for job in jobs]
    try:
        for worker in workers:
            assert worker.stdout.readline().strip() == 'READY', 'Worker failed to reach the barrier.'
        run({'action': 'go'})
        results = []
        for worker in workers:
            out, err = worker.communicate(timeout=20)
            assert worker.returncode == 0, out + err
            assert 'SUCCESS' in out or 'REJECTED' in out, out + err
            results.append('success' if 'SUCCESS' in out else 'rejected')
        return results
    finally:
        for worker in workers:
            if worker.poll() is None:
                worker.kill()
                worker.wait()

cases = ['oversell', 'split', 'cancel', 'reverse', 'release', 'duplicate', 'receiving']
for case in cases:
    data = json.loads(run({'action': 'setup', 'case': case}).splitlines()[-1])
    user, other = data['users']
    if case in ['split', 'duplicate']:
        job = {'action': 'submit', 'user': user, 'item': data['items'][0], 'quantity': 12}
        if case == 'duplicate':
            job['key'] = '11111111-1111-4111-8111-111111111111'
        results = race([job, job])
    else:
        first = data['requests'][0]
        quantity = {'oversell': 60, 'reverse': 30, 'receiving': 110}.get(case, 15)
        job = {'action': 'approve', 'request': first, 'actor': user, 'quantity': quantity}
        peer = {'action': 'approve', 'request': data['requests'][1], 'actor': other, 'quantity': quantity} if case in ['oversell', 'reverse'] else {'action': case, 'request': first, 'actor': user}
        if case == 'receiving':
            peer['receiving'] = data['receiving']
        results = race([job, peer])
    state = json.loads(run({'action': 'inspect', 'user': user}).splitlines()[-1])
    if case == 'oversell':
        assert results.count('success') == 1 and state['stock'] == [40], state
    elif case == 'split':
        assert results.count('success') == 1 and len(state['status']) == 1 and list(state['quota'].values()) == [12] and state['stock'] == [100], state
    elif case == 'cancel':
        assert state['status'] == ['Cancelled'] and state['stock'] == [100] and not state['quota'], state
    elif case == 'reverse':
        assert results == ['success', 'success'] and state['stock'] == [40, 40], state
    elif case == 'duplicate':
        assert results.count('success') >= 1 and len(state['status']) == 1 and list(state['quota'].values()) == [12] and state['stock'] == [100], state
    elif case == 'receiving':
        assert results.count('success') == 1, state
        assert (state['status'] == ['Approved'] and state['stock'] == [10]) or (state['status'] == ['Pending'] and state['stock'] == [105]), state
    else:
        approved = state['approved'][0]
        assert state['status'] == ['Issued'] and state['stock'] == [100 - approved] and state['unit'] == approved and state['issuances'] == 1, state
    print(f'PASS: {case}', flush=True)
print(f'All {len(cases)} PostgreSQL concurrency checks passed.', flush=True)
