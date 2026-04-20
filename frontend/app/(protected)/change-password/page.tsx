'use client';

import { useState } from 'react';
import { Form, Input, Button, Typography, Card, Divider } from 'antd';
import { 
  LockOutlined, 
  KeyOutlined, 
  ArrowRightOutlined
} from '@ant-design/icons';
import { toast } from 'sonner';
import api from '@/lib/api';

const { Title, Text } = Typography;

export default function ChangePasswordPage() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleChangePassword = async (values: any) => {
    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword
      });
      toast.success('Password updated successfully');
      form.resetFields();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Change failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-12 min-h-[calc(100vh-64px)] bg-slate-50/20 flex justify-center items-center">
      <Card 
        className="w-full max-w-lg shadow-2xl rounded-[32px] border-none overflow-hidden bg-white/90 backdrop-blur-md"
        styles={{ body: { padding: '48px' } }}
      >
        <Divider className="border-slate-100 my-10">
          <LockOutlined className="text-slate-200" />
        </Divider>

        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleChangePassword}
          requiredMark={false}
          className="space-y-6"
        >
          <Form.Item
            name="oldPassword"
            label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Current Access Key</span>}
            rules={[{ required: true, message: 'Please enter your current password' }]}
          >
            <Input.Password 
              prefix={<LockOutlined className="text-primary/40 mr-2" />} 
              size="large" 
              placeholder="Enter current password"
              className="rounded-2xl border-slate-100 bg-slate-50/50 hover:bg-white focus:bg-white h-14 px-4 transition-all"
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">New Security Key</span>}
            rules={[
              { required: true, message: 'New password is required' },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined className="text-primary/40 mr-2" />} 
              size="large" 
              placeholder="Min. 6 alphanumeric chars"
              className="rounded-2xl border-slate-100 bg-slate-50/50 hover:bg-white focus:bg-white h-14 px-4 transition-all"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Confirm Authorization</span>}
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm your new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Verification mismatch'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined className="text-primary/40 mr-2" />} 
              size="large" 
              placeholder="Repeat your new security key"
              className="rounded-2xl border-slate-100 bg-slate-50/50 hover:bg-white focus:bg-white h-14 px-4 transition-all"
            />
          </Form.Item>

          <div className="pt-8">
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              loading={loading} 
              size="large"
              icon={<ArrowRightOutlined />}
              className="h-16 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary hover:to-indigo-700 rounded-3xl font-black text-lg shadow-xl shadow-primary/40 border-none transition-all active:scale-[0.98]"
            >
              Verify & Update
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
