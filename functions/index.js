const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

// Initialize admin SDK
admin.initializeApp();

// Read SendGrid API key from environment
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || functions.config().sendgrid?.key;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || functions.config().site?.admin_email || 'umittopuzg@gmail.com';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  console.warn('SendGrid API key not configured. Set SENDGRID_API_KEY env or functions config sendgrid.key');
}

// Firestore trigger: when a new order is created, send an email to admin
exports.onOrderCreated = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    const orderId = context.params.orderId;

    const projectId = order.projectId;
    const userId = order.userId;

    // Try to fetch project and user details for nicer email
    let project = null;
    let user = null;
    try{
      const projSnap = await admin.firestore().doc(`projects/${projectId}`).get();
      if(projSnap.exists) project = projSnap.data();
    }catch(e){/* ignore */}
    try{
      const userSnap = await admin.firestore().doc(`users/${userId}`).get();
      if(userSnap.exists) user = userSnap.data();
    }catch(e){/* ignore */}

    const subject = `Yeni Sipariş: ${project && project.title ? project.title : projectId}`;
    const body = `Yeni bir sipariş alındı.\n\nSipariş ID: ${orderId}\nProje: ${project && project.title ? project.title : projectId}\nKullanıcı: ${user && (user.name || user.email) ? (user.name || user.email) : (userId || 'Bilinmiyor')}\nDurum: ${order.status}\n\nFirestore konsolundan siparişi inceleyebilirsiniz.`;

    if(!SENDGRID_API_KEY){
      console.log('Email not sent (no SendGrid key). Admin should check orders collection.');
      return null;
    }

    const msg = {
      to: ADMIN_EMAIL,
      from: ADMIN_EMAIL, // change to a verified sender in SendGrid
      subject,
      text: body,
      html: `<pre>${body}</pre>`
    };

    try{
      await sgMail.send(msg);
      // mark order as notified
      await admin.firestore().doc(`orders/${orderId}`).update({ notified: true, notifiedAt: admin.firestore.FieldValue.serverTimestamp() });
      console.log('Admin notified for order', orderId);
    }catch(err){
      console.error('Failed to send order email', err);
    }

    return null;
  });
