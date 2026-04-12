import { Button, Space, Typography } from 'antd';

/**
 * Demuestra Ant Design + utilidades Tailwind con prefijo `tw-` sin depender del resto de la app.
 * Útil para validar convivencia visual tras cambios en CSS global.
 */
export function TailwindAntdSmokeTest() {
  return (
    <section
      className="tw-mb-8 tw-max-w-lg tw-rounded-lg tw-border tw-border-solid tw-border-gray-200 tw-bg-gray-50 tw-p-6 tw-shadow-sm"
      aria-label="Prueba de convivencia Tailwind y Ant Design"
    >
      <Typography.Title level={4} className="tw-mb-3">
        Convivencia Tailwind + Ant Design
      </Typography.Title>
      <Typography.Paragraph className="tw-mb-4 tw-text-sm tw-text-gray-600">
        Este bloque usa clases{' '}
        <code className="tw-rounded tw-bg-white tw-px-1 tw-py-0.5 tw-font-mono tw-text-xs">tw-*</code>{' '}
        para layout y tipografía; los botones son componentes de Ant Design.
      </Typography.Paragraph>
      <Space wrap className="tw-gap-2">
        <Button type="primary">Primario</Button>
        <Button>Default</Button>
      </Space>
    </section>
  );
}
