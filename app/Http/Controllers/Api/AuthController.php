<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'device_name' => 'required', // Utile pour identifier le téléphone (ex: iPhone XR)
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Identifiants incorrects.'], 401);
        }

        // On génère le token
        $token = $user->createToken($request->device_name)->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->driver ? 'driver' : 'client' // Simple vérification de rôle
            ]
        ]);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone_number' => 'required|string', // <--- Validation ajoutée
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|in:client,driver', // On définit le rôle dès le départ
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Si c'est un chauffeur, on lui crée son profil Driver vide
        if ($request->role === 'driver') {
            Driver::create([
                'user_id' => $user->id,
                'full_name' => $user->name,
                'phone_number' => $request->phone_number,
                'status' => 'available', // Disponible par défaut
                // On initialise une position par défaut (ex: Place de l'Indépendance)
                'current_location' => \Illuminate\Support\Facades\DB::raw("ST_GeomFromText('POINT(-17.4392 14.6737)', 4326)")
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => $user
        ], 201);
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
}
