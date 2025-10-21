'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';

export default function DebugPage() {
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const userStr = localStorage.getItem('user');

    console.log('Debug - Raw tokens:', { 
      accessToken: accessToken?.substring(0, 100), 
      refreshToken: refreshToken?.substring(0, 100) 
    });

    setTokenInfo({
      hasAccessToken: !!accessToken && accessToken !== 'undefined',
      hasRefreshToken: !!refreshToken && refreshToken !== 'undefined',
      accessToken: accessToken && accessToken !== 'undefined' ? accessToken.substring(0, 50) + '...' : 'NOT SET',
      refreshToken: refreshToken && refreshToken !== 'undefined' ? refreshToken.substring(0, 50) + '...' : 'NOT SET',
      user: userStr ? JSON.parse(userStr) : null,
    });
  }, []);

  const handleClearAndRelogin = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Debug Information</h1>

      <Card>
        <CardHeader>
          <CardTitle>Auth Store State</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>LocalStorage Tokens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium">Has Access Token:</p>
            <p>{tokenInfo?.hasAccessToken ? '✅ Yes' : '❌ No'}</p>
          </div>
          <div>
            <p className="font-medium">Has Refresh Token:</p>
            <p>{tokenInfo?.hasRefreshToken ? '✅ Yes' : '❌ No'}</p>
          </div>
          <div>
            <p className="font-medium">Access Token (first 50 chars):</p>
            <p className="text-xs break-all">{tokenInfo?.accessToken || 'None'}</p>
          </div>
          <div>
            <p className="font-medium">Refresh Token (first 50 chars):</p>
            <p className="text-xs break-all">{tokenInfo?.refreshToken || 'None'}</p>
          </div>
          <div>
            <p className="font-medium">User from localStorage:</p>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
              {JSON.stringify(tokenInfo?.user, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleClearAndRelogin} variant="destructive">
        Clear Everything & Re-login
      </Button>
    </div>
  );
}
