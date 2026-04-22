'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Form, Card, Typography, message, Alert } from 'antd';
import { LockOutlined, CheckCircleOutlined, SaveOutlined } from '@ant-design/icons';
import api from '@/lib/api';

const { Title, Text } = Typography;

/* ================= VALIDATION ================= */
const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordInputs = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new link.');
    }
  }, [token]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInputs>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInputs) => {
    if (!token) return;

    setSubmitting(true);
    setError(null);
    try {
      await api.post('/auth/reset-password', {
        token,
        new_password: data.password,
      });
      setSuccess(true);
      message.success('Password reset successfully!');
      
      // Auto redirect after 3 seconds
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to reset password';
      setError(errMsg);
      message.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      className="w-full max-w-md shadow-2xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-md relative z-10 p-0"
      variant="borderless"
      styles={{ body: { padding: 0 } }}
    >
      {/* --- 🌟 HEADER SECTION (BLUE) --- */}
      <div className="bg-primary p-8 text-center text-white">
        <Image
          src="/images/logo/gilando_logo.png"
          alt="Logo"
          width={100}
          height={40}
          className="h-auto w-[100px] mx-auto mb-6 " // Make logo white
        />
        <Title level={3} style={{ color: 'white', marginBottom: '8px' }}>
          Reset Password
        </Title>
        <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
          Choose a new secure password for your account
        </Text>
      </div>

      {/* --- 📝 FORM SECTION --- */}
      <div className="p-8">
        {error && (
          <Alert
            message="Invalid Link"
            description={error}
            type="error"
            showIcon
            className="mb-6 rounded-lg"
          />
        )}

        {success ? (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a' }} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Password Updated</h3>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">
              Your password has been changed successfully. You will be redirected to the login page shortly.
            </p>
            <Button
              type="primary"
              block
              size="large"
              onClick={() => router.push('/')}
              className="h-[52px] rounded-xl font-semibold bg-primary shadow-lg shadow-primary/20"
            >
              Go to Login Now
            </Button>
          </div>
        ) : (
          <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
            <Form.Item
              label={<span className="font-semibold text-slate-600">New Password</span>}
              validateStatus={errors.password ? 'error' : ''}
              help={errors.password?.message}
            >
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    prefix={<LockOutlined className="text-slate-400 mr-2" />}
                    placeholder="Minimum 6 characters"
                    size="large"
                    className="rounded-xl h-[52px]"
                    disabled={submitting || !token}
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label={<span className="font-semibold text-slate-600">Confirm New Password</span>}
              validateStatus={errors.confirmPassword ? 'error' : ''}
              help={errors.confirmPassword?.message}
            >
              <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    prefix={<LockOutlined className="text-slate-400 mr-2" />}
                    placeholder="Repeat new password"
                    size="large"
                    className="rounded-xl h-[52px]"
                    disabled={submitting || !token}
                  />
                )}
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={submitting}
              disabled={!token}
              icon={<SaveOutlined />}
              className="h-[52px] rounded-xl font-semibold mt-4 shadow-lg shadow-primary/20 bg-primary"
            >
              Update Password
            </Button>
          </Form>
        )}
      </div>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute w-[400px] h-[400px] bg-primary blur-[120px] opacity-20 -top-20 -left-20" />
      <div className="absolute w-[400px] h-[400px] bg-indigo-600 blur-[120px] opacity-20 -bottom-20 -right-20" />
      
      <Suspense fallback={<Card loading className="w-full max-w-md rounded-2xl" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
