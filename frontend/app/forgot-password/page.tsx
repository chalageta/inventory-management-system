'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Form, Card, Typography, message, Alert } from 'antd';
import { MailOutlined, ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import api from '@/lib/api';

const { Title, Text } = Typography;

/* ================= VALIDATION ================= */
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordInputs = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInputs>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInputs) => {
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/auth/forgot-password', data);
      setSuccess(true);
      message.success('Reset instructions sent to your email');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to send reset instructions';
      setError(errMsg);
      message.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-6 relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute w-[400px] h-[400px] bg-primary blur-[120px] opacity-20 -top-12 -left-12" />
      <div className="absolute w-[400px] h-[400px] bg-indigo-600 blur-[120px] opacity-20 -bottom-12 -right-12" />
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
            className="h-auto w-[100px] mx-auto mb-6 brightness-0 invert" // Make logo white
          />
          <Title level={3} style={{ color: 'white', marginBottom: '8px' }}>
            Forgot Password?
          </Title>
          <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Enter your email to receive reset instructions
          </Text>
        </div>

        {/* --- 📝 FORM SECTION --- */}
        <div className="p-8">
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              className="mb-6 rounded-lg"
              onClose={() => setError(null)}
            />
          )}

          {success ? (
            <div className="text-center">
              <Alert
                message="Check Your Email"
                description="We've sent a password reset link to your email address. Please check your inbox and spam folder."
                type="success"
                showIcon
                className="mb-8 rounded-lg text-left"
              />
              <Button
                type="primary"
                block
                size="large"
                onClick={() => router.push('/')}
                icon={<ArrowLeftOutlined />}
                className="h-[48px] rounded-xl font-semibold bg-primary"
              >
                Back to Login
              </Button>
            </div>
          ) : (
            <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
              <Form.Item
                label={<span className="font-semibold text-slate-600">Email Address</span>}
                validateStatus={errors.email ? 'error' : ''}
                help={errors.email?.message}
              >
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      prefix={<MailOutlined className="text-slate-400 mr-2" />}
                      placeholder="Enter your registered email"
                      size="large"
                      className="rounded-xl h-[52px]"
                      disabled={submitting}
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
                icon={<SendOutlined />}
                className="h-[52px] rounded-xl font-semibold mt-4 shadow-lg shadow-primary/20 bg-primary"
              >
                Send Reset Link
              </Button>

              <div className="text-center mt-6">
                <Button
                  type="link"
                  className="font-medium text-slate-500 hover:text-primary flex items-center justify-center gap-2 mx-auto"
                  onClick={() => router.push('/')}
                >
                  <ArrowLeftOutlined style={{ fontSize: 12 }} /> Back to Login
                </Button>
              </div>
            </Form>
          )}
        </div>
      </Card>
    </div>
  );
}
