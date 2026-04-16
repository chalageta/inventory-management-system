'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Button,
  Avatar,
  Typography,
  Tag,
  Spin,
  Upload,
  message
} from 'antd';
import {
  UserOutlined,
  SaveOutlined,
  UploadOutlined
} from '@ant-design/icons';

import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

const { Title, Text } = Typography;

export default function ProfilePage() {
  const { user, getMe, loading: authLoading } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<any>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        address: user.address,
        bio: user.bio
      });

      if (user.image) {
        const fullUrl = user.image.startsWith('http') 
          ? user.image 
          : `${BASE_URL}${user.image}`;
        setPreview(fullUrl);
      }
    }
  }, [user, BASE_URL, form]);

  const handleImage = (info: any) => {
    const fileObj = info.file.originFileObj;
    if (fileObj) {
      setFile(fileObj);
      setPreview(URL.createObjectURL(fileObj));
    }
  };

  const handleUpdateProfile = async (values: any) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('name', values.name || '');
      formData.append('email', values.email || '');
      formData.append('phone', values.phone || '');
      formData.append('gender', values.gender || '');
      formData.append('address', values.address || '');
      formData.append('bio', values.bio || '');

      if (file) {
        formData.append('image', file);
      }

      const res = await api.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      message.success(res.data?.message || "Profile updated successfully");
      setFile(null);
      await getMe();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="flex justify-center items-center min-h-screen"><Spin size="large" /></div>;

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card className="text-center shadow-sm rounded-xl border-none">
            <Avatar size={120} src={preview} icon={<UserOutlined />} className="mb-4 shadow-md border-4 border-white" />
            <Title level={4} className="m-0 uppercase tracking-tight">{user?.name}</Title>
            <Text type="secondary" className="block mb-3">{user?.email}</Text>
            <Tag color="blue" className="px-4 py-0.5 rounded-full border-none font-bold uppercase text-[10px]">
              {user?.role_name || 'Staff'}
            </Tag>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title={<span className="font-bold">Profile Details</span>} className="shadow-sm rounded-xl border-none">
            <Form form={form} layout="vertical" onFinish={handleUpdateProfile}>
              <Row gutter={16}>
                <Col xs={24} md={12}><Form.Item name="name" label="Full Name"><Input size="large" /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item name="email" label="Email Address"><Input size="large" /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item name="phone" label="Phone Number"><Input size="large" /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item name="gender" label="Gender"><Input size="large" /></Form.Item></Col>
                <Col span={24}><Form.Item name="address" label="Address"><Input.TextArea rows={2} /></Form.Item></Col>
                <Col span={24}><Form.Item name="bio" label="About You"><Input.TextArea rows={3} /></Form.Item></Col>
                <Col span={24} className="mb-6">
                  <Text className="block mb-2 text-xs font-bold text-slate-400 uppercase">Profile Picture</Text>
                  <Upload beforeUpload={() => false} onChange={handleImage} showUploadList={false} maxCount={1}>
                    <Button icon={<UploadOutlined />} className="w-full md:w-auto">Select New Photo</Button>
                  </Upload>
                </Col>
              </Row>
              <Button type="primary" icon={<SaveOutlined />} loading={loading} htmlType="submit" size="large" className="bg-blue-600 h-12 px-8 rounded-lg">
                Save Changes
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}