'use client';

import { useState } from 'react';
import { Form, Input, Button, Typography, Card } from 'antd';
import { LockOutlined, SecurityScanFilled, ShopFilled } from '@ant-design/icons';
import { toast } from 'sonner';
import api from '@/lib/api';

const { Title, Text } = Typography;

export default function ChangePasswordPage() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleChangePassword = async (values: any) => {
    setLoading(true);
    try {
      // We only send oldPassword and newPassword to the API
      await api.put('/auth/change-password', {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword
      });
      toast.success('Password changed successfully');
      form.resetFields();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Change failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-12 min-h-screen bg-slate-50 flex justify-center items-start">
      <Card className="w-full max-w-md shadow-lg rounded-2xl border-none">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <SecurityScanFilled className="text-blue-600 w-8 h-8" />
          </div>
          <Title level={3} className="mb-1">Security Settings</Title>
          <Text type="secondary">Keep your account secure by updating your password</Text>
        </div>

        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleChangePassword}
          requiredMark={false}
        >
          <Form.Item
            name="oldPassword"
            label={<span className="font-semibold text-slate-600">Current Password</span>}
            rules={[{ required: true, message: 'Current password is required' }]}
          >
            <Input.Password 
              prefix={<LockOutlined className="text-slate-400 mr-2" />} 
              size="large" 
              placeholder="••••••••"
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label={<span className="font-semibold text-slate-600">New Password</span>}
            rules={[
              { required: true, message: 'New password is required' },
              { min: 6, message: 'Must be at least 6 characters' },
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined className="text-slate-400 mr-2" />} 
              size="large" 
              placeholder="••••••••"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={<span className="font-semibold text-slate-600">Confirm New Password</span>}
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined className="text-slate-400 mr-2" />} 
              size="large" 
              placeholder="••••••••"
            />
          </Form.Item>

          <Button 
            type="primary" 
            htmlType="submit" 
            block 
            loading={loading} 
            size="large"
            className="h-12 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold mt-4"
          >
            Update Password
          </Button>
        </Form>
      </Card>
    </div>
  );
}