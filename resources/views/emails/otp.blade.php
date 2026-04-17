<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Arial', sans-serif; background-color: #fbfbfb; padding: 20px; }
        .card {
            background: white;
            max-width: 400px;
            margin: 0 auto;
            padding: 30px;
            border-radius: 24px;
            text-align: center;
            border: 1px solid #eee;
        }
        .logo {
            background: #F8B803;
            width: 50px;
            height: 50px;
            line-height: 50px;
            border-radius: 15px;
            display: inline-block;
            font-weight: bold;
            font-size: 20px;
            margin-bottom: 20px;
        }
        .otp {
            font-size: 32px;
            font-weight: 900;
            letter-spacing: 5px;
            color: #000;
            margin: 20px 0;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 12px;
        }
        .footer { color: #aaa; font-size: 10px; text-transform: uppercase; margin-top: 20px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="card">
        <div class="logo">ST</div>
        <h2 style="margin: 0; text-transform: uppercase; tracking-tighter: -1px;">Vérification</h2>
        <p style="color: #666; font-size: 14px;">Utilisez le code ci-dessous pour réinitialiser votre mot de passe SamaTaxi.</p>

        <div class="otp">{{ $otp }}</div>

        <p style="color: #999; font-size: 12px;">Ce code expirera dans 15 minutes.</p>
        <div class="footer">SamaTaxi Live • Dakar, Sénégal</div>
    </div>
</body>
</html>
