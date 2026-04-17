<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\OtpMail;
use App\Models\Driver;
use App\Models\Passenger; // Ajouté
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'device_name' => 'required',
        ]);

        // On charge les relations pour éviter les requêtes SQL en boucle (Eager Loading)
        $user = User::with(['driver', 'passenger'])->where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Identifiants incorrects.'], 401);
        }

        // Suppression des anciens tokens si tu veux une session unique par appareil
        // $user->tokens()->where('name', $request->device_name)->delete();

        $token = $user->createToken($request->device_name)->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                // Logique de rôle robuste
                'role' => $user->driver ? 'driver' : 'passenger',
                'profile' => $user->driver ?? $user->passenger
            ]
        ]);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone_number' => 'required|string', // Validation simplifiée pour test
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|in:passenger,driver',
            'device_name' => 'required|string',
        ]);

        try {
            return DB::transaction(function () use ($request) {
                $user = User::create([
                    'name' => $request->name,
                    'email' => $request->email,
                    'password' => Hash::make($request->password),
                ]);

                if ($request->role === 'driver') {
                    Driver::create([
                        'user_id' => $user->id,
                        'phone_number' => $request->phone_number,
                        'status' => 'available',
                        'current_location' => DB::raw("ST_GeomFromText('POINT(-17.4392 14.6737)', 4326)")
                    ]);
                } else {
                    // Si ça plante ici, c'est le $fillable du modèle Passenger
                    Passenger::create([
                        'user_id' => $user->id,
                        'phone_number' => $request->phone_number,
                    ]);
                }

                $token = $user->createToken($request->device_name)->plainTextToken;

                return response()->json([
                    'success' => true,
                    'token' => $token,
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'role' => $request->role,
                    ]
                ], 201);
            });
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur serveur : ' . $e->getMessage()
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        // On supprime le token actuel de l'utilisateur
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Déconnexion réussie'
        ]);
    }

    public function sendOtp(Request $request)
    {
        $request->validate(['email' => 'required|email|exists:users,email']);

        // Générer un code à 6 chiffres
        $otp = rand(100000, 999999);

        // Sauvegarder en base (on supprime les anciens codes pour cet email d'abord)
        DB::table('password_reset_otps')->where('email', $request->email)->delete();
        DB::table('password_reset_otps')->insert([
            'email' => $request->email,
            'otp' => $otp, // Idéalement Hashé, mais pour le dev on peut garder en clair
            'expires_at' => Carbon::now()->addMinutes(15),
        ]);

        // Envoyer le mail (Tu devras créer une classe Mailable Laravel)
        Mail::to($request->email)->send(new OtpMail($otp));

        return response()->json(['success' => true, 'message' => 'Code envoyé par email.']);
    }

    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string|size:6',
            'password' => 'required|string|min:8|confirmed'
        ]);

        $record = DB::table('password_reset_otps')
            ->where('email', $request->email)
            ->where('otp', $request->otp)
            ->where('expires_at', '>', Carbon::now())
            ->first();

        if (!$record) {
            return response()->json(['success' => false, 'message' => 'Code invalide ou expiré.'], 422);
        }

        // Mettre à jour le mot de passe
        $user = User::where('email', $request->email)->first();
        $user->update(['password' => Hash::make($request->password)]);

        // Nettoyer
        DB::table('password_reset_otps')->where('email', $request->email)->delete();

        return response()->json(['success' => true, 'message' => 'Mot de passe modifié avec succès.']);
    }
}
