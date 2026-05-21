<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureDriverIsVerified
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->check() && auth()->user()->driver) {
            $driver = auth()->user()->driver;

            if (!$driver->isVerified()) {
                return response()->json([
                    'message' => 'Votre compte conducteur est en cours de vérification ou a été suspendu. Veuillez contacter le support pour plus d\'informations.',
                ], 403);
            }
        }
        return $next($request);
    }
}
