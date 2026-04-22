<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PassengerController extends Controller
{
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $passenger = $user->passenger;

        // Validation
        $request->validate([
            'full_name'    => 'required|string|max:255',
            'email'        => 'required|email|unique:users,email,' . $user->id,
            'phone_number' => 'required|string|max:20',
            'avatar'       => 'nullable|image|mimes:jpeg,png,jpg|max:2048', // Max 2Mo
        ], [
            // Ajoute tes messages personnalisés ici si tes fichiers lang ne sont pas prêts
            'full_name.required' => 'Le nom complet est obligatoire',
            'email.required' => 'L\'email est obligatoire',
            'email.email' => 'L\'email doit être une adresse valide',
            'email.unique' => 'Cet email est déjà utilisé',
            'phone_number.required' => 'Le numéro de téléphone est requis',
            'phone_number.max' => 'Le numéro de téléphone ne doit pas dépasser 20 caractères',
            'avatar.required' => 'La photo de profil est requise',
            'avatar.image' => 'Le fichier doit être une image',
            'avatar.mimes' => 'Le fichier doit être au format JPEG, PNG ou JPG',
            'avatar.max' => 'Le fichier ne doit pas dépasser 2Mo',
        ]);

        // 1. Update User Table
        $user->update([
            'name'  => $request->full_name,
            'email' => $request->email
        ]);

        // 2. Gestion de l'Avatar
        $avatarPath = $passenger->avatar;
        if ($request->hasFile('avatar')) {
            // Supprimer l'ancien avatar s'il existe
            if ($avatarPath) {
                Storage::disk('public')->delete($avatarPath);
            }
            // Stocker le nouveau
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
        }

        // 3. Update ou Create Passenger Table
        // updateOrCreate évite les erreurs si l'entrée n'existe pas en base
        // Update Passenger
        $passenger->update([
            'phone_number' => $request->phone_number,
            'avatar'       => $avatarPath,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Profil mis à jour',
            'user'    => $user->load('passenger') // On renvoie le user frais
        ]);
    }
}
