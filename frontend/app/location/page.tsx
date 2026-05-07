"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Form, Select, Input, Spin, Card } from "antd";

type Option = {
  value: number | string;
  label: string;
};

type Field = {
  name: string;
  label: string;
  type: "select" | "dependent" | "text";
  options?: Option[];
  dependsOn?: string | null;
  dependentOptions?: Record<string, Option[]>;
};

type Schema = {
  fields: Field[];
};

export default function EfdaDynamicFormPage() {
  const [form] = Form.useForm();

  const [schema, setSchema] = useState<Schema | null>(null);
  const [loading, setLoading] = useState(true);

  const [regionValue, setRegionValue] = useState<number | null>(null);
  const [zoneValue, setZoneValue] = useState<number | null>(null);

  // =========================
  // LOAD SCHEMA
  // =========================
  useEffect(() => {
    axios
      .get("http://localhost:8080/api/efda/schema")
      .then((res) => setSchema(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin fullscreen />;

  if (!schema) return <div>No schema found</div>;

  // =========================
  // HANDLE DEPENDENCIES
  // =========================
  const handleChange = (name: string, value: any) => {
    if (name === "regionId") {
      setRegionValue(value);
      form.setFieldsValue({ zoneId: undefined, woredaId: undefined });
      setZoneValue(null);
    }

    if (name === "zoneId") {
      setZoneValue(value);
      form.setFieldsValue({ woredaId: undefined });
    }
  };

  // =========================
  // RENDER FIELD
  // =========================
  const renderField = (field: Field) => {
    switch (field.type) {
      case "select":
        return (
          <Select
            options={field.options}
            onChange={(val) => handleChange(field.name, val)}
          />
        );

      case "dependent":
        const parentValue =
          field.dependsOn === "regionId"
            ? regionValue
            : field.dependsOn === "zoneId"
            ? zoneValue
            : null;

        const options =
          parentValue && field.dependentOptions
            ? field.dependentOptions[parentValue] || []
            : [];

        return (
          <Select
            options={options}
            onChange={(val) => handleChange(field.name, val)}
            disabled={!parentValue}
          />
        );

      case "text":
        return <Input />;

      default:
        return null;
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <div style={{ padding: 20 }}>
      <Card title="EFDA Dynamic Form">
        <Form form={form} layout="vertical">
          {schema.fields.map((field) => (
            <Form.Item key={field.name} name={field.name} label={field.label}>
              {renderField(field)}
            </Form.Item>
          ))}
        </Form>
      </Card>
    </div>
  );
}