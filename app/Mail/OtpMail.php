<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public $otp;

    /**
     * On passe l'OTP au constructeur
     */
    public function __construct($otp)
    {
        $this->otp = $otp;
    }

    /**
     * Définition de l'objet du mail
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->otp . ' est votre code de sécurité SamaTaxi',
        );
    }

    /**
     * Définition de la vue et des données
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.otp', // On va créer ce fichier Blade
            with: [
                'otp' => $this->otp,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
