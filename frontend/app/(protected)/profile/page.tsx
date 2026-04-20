'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Button,
  Typography,
  Tag,
  Spin,
  Upload,
  message,
  Select,
  Divider,
} from 'antd';
import {
  UserOutlined,
  SaveOutlined,
  CameraOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';

import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const { Title, Text } = Typography;
const { Option } = Select;

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
        bio: user.bio,
      });

      if (user.image && user.image.startsWith("/uploads")) {
        setPreview(`${BASE_URL}${user.image}`);
      } else {
        setPreview(null);
      }
    }
  }, [user, BASE_URL, form]);

  const getInitials = (name: string) => {
    if (!name) return "??";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const handleImage = (info: any) => {
    // Robustly extract the file object
    const fileObj = info.file.originFileObj || info.file;
    if (fileObj instanceof File || fileObj instanceof Blob) {
      // Clean up the old preview URL to avoid memory leaks
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }

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
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      message.success(res.data?.message || "Profile updated successfully");
      setFile(null);
      await getMe();
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 bg-slate-50/10 min-h-screen">
      
      {/* HEADER SECTION */}
      <div className="mb-8">
        <Title level={2} className="m-0 text-slate-800 font-extrabold tracking-tight">Account Settings</Title>
        <Text type="secondary" className="text-sm">Manage your personal information and profile preferences.</Text>
      </div>

      <Row gutter={[32, 24]}>
        {/* LEFT: PROFILE CARD */}
        <Col xs={24} lg={8}>
          <Card 
            className="overflow-hidden shadow-xl rounded-3xl border-none bg-white"
            styles={{ body: { padding: 0 } }}
          >
            {/* Top Banner (Gradient) */}
            <div className="h-32 bg-gradient-to-r from-primary to-indigo-700" />
            
            <div className="px-6 pb-8 text-center -mt-16">
              <div className="relative inline-block mb-4">
                <div className="h-32 w-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-50 flex items-center justify-center">
                  {preview ? (
                    <img src={preview} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-primary">
                      {getInitials(user?.name || "User")}
                    </span>
                  )}
                </div>
                
                {/* Upload Button Overlay */}
                <Upload 
                  accept="image/*"
                  beforeUpload={() => false} 
                  onChange={handleImage} 
                  showUploadList={false}
                  maxCount={1}
                >
                  <Button 
                    type="primary"
                    shape="circle" 
                    icon={<CameraOutlined />} 
                    className="absolute bottom-1 right-1 bg-primary border-2 border-white h-10 w-10 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                  />
                </Upload>
              </div>

              <Title level={3} className="m-0 font-bold text-slate-900">{user?.name}</Title>
              <Text type="secondary" className="block text-sm mb-4">{user?.email}</Text>
              
              <Tag color="blue" className="px-4 py-0.5 rounded-full border-none font-bold uppercase text-[10px] tracking-widest shadow-sm">
                {user?.role_name || 'Staff'}
              </Tag>

              <Divider className="my-6" />

              <div className="space-y-4 text-left px-2">
                <div className="flex items-center gap-3 text-slate-600">
                  <MailOutlined className="text-primary" />
                  <span className="text-sm truncate">{user?.email}</span>
                </div>
                {user?.phone && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <PhoneOutlined className="text-primary" />
                    <span className="text-sm">{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-slate-600">
                  <GlobalOutlined className="text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded border">
                    Account Status: Active
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* RIGHT: EDIT FORM */}
        <Col xs={24} lg={16}>
          <Card 
            className="shadow-xl rounded-3xl border-none bg-white min-h-full"
            title={
              <div className="flex items-center gap-2 py-2">
                <UserOutlined className="text-primary font-bold" />
                <span className="text-slate-800 font-bold">Personal Information</span>
              </div>
            }
          >
            <Form 
              form={form} 
              layout="vertical" 
              onFinish={handleUpdateProfile}
              requiredMark={false}
            >
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item 
                    name="name" 
                    label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</span>}
                    rules={[{ required: true, message: "Please enter your name" }]}
                  >
                    <Input size="large" className="rounded-xl border-slate-100 bg-slate-50/50" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item 
                    name="email" 
                    label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address (Username)</span>}
                    rules={[{ required: true, message: "Please enter your email", type: "email" }]}
                  >
                    <Input disabled size="large" className="rounded-xl border-slate-100 bg-slate-50/50 cursor-not-allowed opacity-70" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item 
                    name="phone" 
                    label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</span>}
                  >
                    <Input size="large" className="rounded-xl border-slate-100 bg-slate-50/50" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item 
                    name="gender" 
                    label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gender</span>}
                  >
                    <Select size="large" className="rounded-xl border-slate-100 bg-slate-50/50">
                      <Option value="Male">Male</Option>
                      <Option value="Female">Female</Option>
                      <Option value="Other">Other</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item 
                    name="address" 
                    label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mailing Address</span>}
                  >
                    <Input.TextArea 
                      rows={2} 
                      className="rounded-xl border-slate-100 bg-slate-50/50" 
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item 
                    name="bio" 
                    label={
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Professional Bio</span>
                        <InfoCircleOutlined className="text-[10px] text-slate-300" />
                      </div>
                    }
                  >
                    <Input.TextArea 
                      rows={4} 
                      placeholder="Briefly describe your role or background..."
                      className="rounded-xl border-slate-100 bg-slate-50/50" 
                    />
                  </Form.Item>
                </Col>
              </Row>

              <div className="flex justify-end mt-4">
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />} 
                  loading={loading} 
                  htmlType="submit" 
                  size="large" 
                  className="bg-primary hover:bg-primary h-14 px-12 rounded-2xl font-bold shadow-lg shadow-primary/30 transition-all hover:scale-[1.02]"
                >
                  Save Changes
                </Button>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
