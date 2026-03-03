"use client";

import { useState } from 'react';
import { useAuth } from '../../components/providers/AuthProvider';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Lock, Mail, User, Phone } from 'lucide-react';


export default function LoginPage() {
    const { login, loginEmployee } = useAuth();

    // Auth Mode State
    const [mode, setMode] = useState('admin');

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Status States
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError('');
        setLoading(true);

        let res;
        if (mode === 'admin') {
            res = await login(email, password);
        } else {
            res = await loginEmployee(email, password);
        }

        if (res.error) {
            setError(res.error);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
            <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
                <CardHeader className="text-center space-y-2 pb-4">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                        {mode === 'admin' ? <Lock className="w-6 h-6 text-primary" /> : <User className="w-6 h-6 text-primary" />}
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">MiEstilo CRM</CardTitle>
                    <p className="text-sm text-gray-500">Sign in to manage your leads</p>

                    {/* Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-lg mt-4">
                        <button
                            type="button"
                            onClick={() => { setMode('admin'); setError(''); }}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'admin' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Admin
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMode('employee'); setError(''); }}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'employee' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Employee
                        </button>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <Input
                                    type="email"
                                    placeholder={mode === 'employee' ? "name@miestilo.com" : "admin@company.com"}
                                    className="pl-10"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-sm font-medium text-gray-700">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>


                        <Button type="submit" className="w-full mt-2" size="lg" isLoading={loading}>
                            {mode === 'admin' ? 'Sign In' : 'Join as Employee'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center border-t pt-4">
                    <p className="text-xs text-gray-400">
                        MiEstilo Manufacturing • Internal System
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

