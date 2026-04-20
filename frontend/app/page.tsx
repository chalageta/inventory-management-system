'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, Input, Form, Card, Typography, message, Alert } from 'antd';
import {
  MailOutlined,
  LockOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';

import { useAuth } from '@/lib/auth-context';

const { Title, Text } = Typography;

/* ================= VALIDATION ================= */
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'), // Removed 6 character requirement
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null); // State for backend errors

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  /* ================= REDIRECT ================= */
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  /* ================= LOGIN ================= */
  const onSubmit = async (data: LoginFormInputs) => {
    setSubmitting(true);
    setLoginError(null);
    try {
      await login(data.email, data.password);
      message.success('Login successful');
      router.replace('/dashboard');
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Invalid credentials';
      setLoginError(errMsg);
      message.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ================= LEFT BACKGROUND (MOBILE FULL + DESKTOP HALF) ================= */}
      <div className="fixed inset-0 lg:relative lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">

        {/* Glow effects */}
        <div className="absolute w-[350px] h-[350px] bg-primary blur-[120px] opacity-30 top-[-50px] left-[-50px]" />
        <div className="absolute w-[350px] h-[350px] bg-indigo-600 blur-[120px] opacity-30 bottom-[-50px] right-[-50px]" />

        {/* Content */}
        <div className="relative text-center px-6">

          {/* LOGO */}
          <Image
            src="/images/logo/gilando_logo.webp"
            alt="Inventory Logo"
            width={200}
            height={80}
            className="h-auto w-[180px] mx-auto mb-6"
            priority
          />

          {/* Desktop only text */}
          <h1 className="hidden lg:block text-4xl font-bold text-white">
            Inventory Management System
          </h1>

          <p className="hidden lg:block text-slate-300 mt-4 max-w-md mx-auto">
            Manage stock, purchases, sales, and reporting in one unified platform.
          </p>
        </div>
      </div>

      {/* ================= RIGHT FORM ================= */}
      <div className="relative z-10 w-full lg:w-1/2 flex items-center justify-center p-6">

        <Card
          className="w-full max-w-md shadow-xl rounded-2xl bg-white/95 backdrop-blur-md"
          variant="borderless"
          styles={{ body: { padding: 28 } }}
        >

          {/* TITLE */}
          <div className="text-center mb-6">
            <Title level={3} style={{ marginBottom: 0 }}>
              Welcome Back
            </Title>
            <Text type="secondary">
              Sign in to your inventory dashboard
            </Text>
          </div>

          {/* BACKEND ERROR DISPLAY */}
          {loginError && (
            <Alert
              message={loginError}
              type="error"
              showIcon
              closable
              onClose={() => setLoginError(null)}
              className="mb-6 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300"
            />
          )}

          {/* FORM */}
          <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>

            {/* EMAIL */}
            <Form.Item
              label="Email"
              validateStatus={errors.email ? 'error' : ''}
              help={errors.email?.message}
            >
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    prefix={<MailOutlined />}
                    placeholder="admin@inventory.com"
                    size="large"
                    disabled={submitting}
                    onChange={(e) => {
                      field.onChange(e);
                      if (loginError) setLoginError(null);
                    }}
                  />
                )}
              />
            </Form.Item>

            {/* PASSWORD */}
            <Form.Item
              label="Password"
              validateStatus={errors.password ? 'error' : ''}
              help={errors.password?.message}
            >
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    prefix={<LockOutlined />}
                    placeholder="••••••••"
                    size="large"
                    disabled={submitting}
                    onChange={(e) => {
                      field.onChange(e);
                      if (loginError) setLoginError(null);
                    }}
                  />
                )}
              />
            </Form.Item>

            {/* BUTTON */}
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={submitting}
              icon={<ArrowRightOutlined />}
              style={{
                height: 45,
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              Sign In
            </Button>

          </Form>

          {/* FOOTER */}
          <div className="text-center mt-5">
            <Text type="secondary">
              Need access? <a>Contact Admin</a>
            </Text>
          </div>

        </Card>
      </div>
    </div>
  );
}