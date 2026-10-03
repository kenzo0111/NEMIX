@extends('errors::minimal')

@section('title', 'Link Expired')
@section('code', '410')
@section('message')
    @if (request()->routeIs('register.invitation'))
        This invitation has expired or has already been used. Ask your administrator to resend the invitation email.
    @else
        This password reset link has expired or has already been used.
        <a class="underline" href="{{ route('password.request') }}">Request a new reset email</a>.
    @endif
@endsection
