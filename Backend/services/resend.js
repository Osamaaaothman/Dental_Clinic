import React from 'react';
import { Body, Container, Head, Html, Text } from '@react-email/components';
import { render } from '@react-email/render';
import { Resend } from 'resend';
import { ValidationError } from '../utils/errors.js';

function AppointmentReminderEmail({ patientName, appointmentDate, doctorName }) {
  return (
    <Html lang="ar" dir="rtl">
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f8fafc', padding: '24px' }}>
        <Container style={{ maxWidth: 520, margin: '0 auto', background: '#ffffff', borderRadius: 12, padding: 24 }}>
          <Text style={{ margin: 0, color: '#0f172a', fontSize: 18, fontWeight: 700 }}>
            تذكير بموعد العيادة
          </Text>
          <Text style={{ margin: '12px 0 0', color: '#334155', fontSize: 14 }}>
            مرحبًا {patientName || 'عميلنا الكريم'}،
          </Text>
          <Text style={{ margin: '8px 0 0', color: '#334155', fontSize: 14 }}>
            نود تذكيرك بموعدك القادم بتاريخ:
          </Text>
          <Container style={{ marginTop: 12, padding: 12, background: '#f1f5f9', borderRadius: 10 }}>
            <Text style={{ margin: 0, color: '#0f172a', fontWeight: 600 }}>{appointmentDate}</Text>
          </Container>
          <Text style={{ margin: '12px 0 0', color: '#334155', fontSize: 14 }}>
            مع تحيات عيادة {doctorName || 'الأسنان'}.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export async function sendAppointmentReminder({
  patientEmail,
  patientName,
  appointmentDate,
  doctorName,
}) {
  if (!patientEmail) {
    throw new ValidationError('patientEmail is required');
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const html = render(
    AppointmentReminderEmail({ patientName, appointmentDate, doctorName })
  );

  const subject = 'تذكير بموعد العيادة';

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'Clinic <no-reply@clinic.local>',
    to: patientEmail,
    subject,
    html,
  });
}
