<?php
require '/var/www/html/vendor/autoload.php';
$app = require '/var/www/html/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$units = [
 'cas' => 'College of Arts and Sciences (CAS) - Main Campus',
 'cbpa' => 'College of Business and Public Administration (CBPA) - Main Campus',
 'coe' => 'College of Engineering - Main Campus',
 'gs' => 'Graduate School (GS) - Main Campus',
 'ccms' => 'College of Computing and Multimedia Studies (CCMS) - Main Campus',
 'coed' => 'College of Education (CoEd) - Abaño Campus',
 'cfast' => 'College of Fisheries, Aquatic Sciences, & Technology (CFAST) - Mercedes Campus',
 'canr' => 'College of Agriculture and Natural Resources (CANR) - Labo Campus',
 'cott' => 'College of Trades and Technology (CoTT) - Jose Panganiban Campus',
];
$permissions = [
 'route:inventory.requests.index', 'route:inventory.requests.store',
 'route:inventory.requests.update', 'route:inventory.requests.cancel',
 'route:inventory.requests.ris-pdf',
];
$result = Illuminate\Support\Facades\DB::transaction(function () use ($units, $permissions) {
 $role = Spatie\Permission\Models\Role::firstOrCreate(['name'=>'Demo Supply Coordinator','guard_name'=>'web']);
 if ($role->permissions()->pluck('name')->diff($permissions)->isNotEmpty()) {
  throw new RuntimeException('Existing demo role has unexpected permissions; no accounts created.');
 }
 foreach ($permissions as $permission) {
  Spatie\Permission\Models\Permission::firstOrCreate(['name'=>$permission,'guard_name'=>'web']);
 }
 $role->syncPermissions($permissions);
 $accounts = [];
 foreach ($units as $code => $unit) {
  $email = $code.'.coordinator@demo.supplysync.test';
  $name = strtoupper($code).' Supply Coordinator (DEMO)';
  $existing = App\Models\User::where('email',$email)->first();
  if ($existing) {
   if ($existing->name !== $name || !$existing->hasRole($role)) {
    throw new RuntimeException('An existing account conflicts with the demo roster. No changes made.');
   }
   $accounts[] = ['college'=>$unit,'email'=>$email,'status'=>'already exists; password unchanged'];
   continue;
  }
  $password = Illuminate\Support\Str::password(20);
  $user = new App\Models\User();
  $user->forceFill([
   'name'=>$name,'email'=>$email,'password'=>Illuminate\Support\Facades\Hash::make($password),
   'is_active'=>true,'email_verified_at'=>now(),
  ])->save();
  $user->assignRole($role);
  if (!Illuminate\Support\Facades\Hash::check($password,$user->fresh()->password)) {
   throw new RuntimeException('Password verification failed; account creation rolled back.');
  }
  $accounts[] = ['college'=>$unit,'name'=>$name,'email'=>$email,'password'=>$password,'status'=>'created'];
 }
 return $accounts;
});
app(Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
echo json_encode(['login_url'=>'https://unc-nemix.com/login','role'=>'Demo Supply Coordinator',
 'unit_assignment'=>'College represented in demo account name; no unit database field exists.',
 'created'=>count(array_filter($result,fn($a)=>$a['status']==='created')),'accounts'=>$result],JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
