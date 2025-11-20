// Test script to send survey invitation email to mariano.morales@autostrefa.mx
const SUPABASE_URL = 'https://jjepfehmuybpctdzipnu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZXBmZWhtdXlicGN0ZHppcG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxOTk2MDMsImV4cCI6MjA1OTc3NTYwM30.yaMESZqaoLvkbVSgdHxpU-Vb7q-naxj95QxcpRYPrX4';

async function sendTestEmail() {
    console.log('📧 Sending test survey invitation email...');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-brevo-email`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
            to: 'mariano.morales@autostrefa.mx',
            toName: 'Mariano Morales',
            subject: '🎁 Tu Cupón de Beneficios TREFA te Espera - Responde nuestra Encuesta',
            templateType: 'survey_invitation',
            templateData: {
                clientName: 'Mariano',
                userId: 'test-user-123',
                surveyUrl: 'https://trefa.mx/encuesta-anonima'
            }
        })
    });

    const result = await response.json();

    if (response.ok) {
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', result.messageId);
        console.log('\n📬 Check mariano.morales@autostrefa.mx for the test email');
    } else {
        console.error('❌ Error sending email:', result.error);
    }
}

sendTestEmail().catch(console.error);
