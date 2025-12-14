// admin/js/tickets.js

let selectedTicketId = null;
let messagesUnsubscribe = null;

// Auth Check
auth.onAuthStateChanged(async (user) => {
    if (user) {
        await requireAdmin();
        loadTickets();
    } else {
        window.location.href = '/';
    }
});

// Load Tickets List
async function loadTickets() {
    const list = document.getElementById('ticketsList');
    const filter = document.getElementById('statusFilter').value;

    list.innerHTML = '<p style="text-align: center;">جاري التحميل...</p>';

    try {
        let query = db.collection('tickets').orderBy('updatedAt', 'desc');

        if (filter !== 'all') {
            query = query.where('status', '==', filter);
        }

        const snapshot = await query.get();

        list.innerHTML = '';
        if (snapshot.empty) {
            list.innerHTML = '<p style="text-align: center; padding: 20px;">لا توجد تذاكر</p>';
            return;
        }

        snapshot.forEach(doc => {
            const ticket = doc.data();
            const isActive = doc.id === selectedTicketId ? 'active' : '';
            const isUnread = ticket.hasUnread ? 'unread' : ''; // You might want to implement 'read by admin' logic

            list.innerHTML += `
                <div class="ticket-item ${isActive} ${isUnread}" onclick="selectTicket('${doc.id}')">
                    <div class="ticket-header">
                        <span class="ticket-subject">${escapeHtml(ticket.subject)}</span>
                        <span class="status-badge status-${ticket.status}">${ticket.status === 'open' ? 'مفتوح' : 'مغلق'}</span>
                    </div>
                    <div class="ticket-user">👤 ${escapeHtml(ticket.userName || ticket.userEmail)}</div>
                    <div class="ticket-time">${formatDate(ticket.updatedAt)}</div>
                </div>
            `;
        });

    } catch (error) {
        console.error(error);
        list.innerHTML = '<p style="text-align: center; color: red;">خطأ في التحميل</p>';
    }
}

// Select Ticket
async function selectTicket(ticketId) {
    selectedTicketId = ticketId;

    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('chatArea').style.display = 'flex';

    // Refresh list to update active state (simple way)
    // In a real app, just toggle classes
    const items = document.querySelectorAll('.ticket-item');
    items.forEach(item => item.classList.remove('active'));
    // Ideally find the element and add active, but here we reload or just proceed

    // Load Ticket Details
    const doc = await db.collection('tickets').doc(ticketId).get();
    const ticket = doc.data();

    document.getElementById('chatSubject').textContent = ticket.subject;
    document.getElementById('chatUser').textContent = `${ticket.userName} (${ticket.userEmail})`;

    const closeBtn = document.getElementById('closeTicketBtn');
    if (ticket.status === 'closed') {
        closeBtn.textContent = 'إعادة فتح';
        closeBtn.className = 'btn btn-primary btn-small';
    } else {
        closeBtn.textContent = 'إغلاق التذكرة';
        closeBtn.className = 'btn btn-secondary btn-small';
    }

    loadMessages(ticketId);
}

// Load Messages
function loadMessages(ticketId) {
    const chatContainer = document.getElementById('chatMessages');
    chatContainer.innerHTML = '<p style="text-align: center;">جاري تحميل المحادثة...</p>';

    if (messagesUnsubscribe) messagesUnsubscribe();

    messagesUnsubscribe = db.collection('tickets').doc(ticketId)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
            chatContainer.innerHTML = '';

            snapshot.forEach(doc => {
                const msg = doc.data();
                // Admin messages are 'admin', User messages are 'user'
                // In our schema: msg.isAdmin is boolean or check senderId
                // Since this is ADMIN panel: 
                // Me (Admin) -> Right
                // User -> Left

                const isAdminMsg = msg.isAdmin || msg.senderId === currentUser.uid; // Should rely on a flag if possible
                // Better: check if sender is NOT the ticket owner? Or just use isAdmin flag.
                // We set isAdmin: false for user, need to set isAdmin: true for admin replies.

                const type = msg.isAdmin ? 'admin' : 'user';

                chatContainer.innerHTML += `
                    <div class="message ${type}">
                        <div class="msg-content">
                            <div>${escapeHtml(msg.content)}</div>
                            <small style="opacity: 0.7; font-size: 0.7em;">${msg.senderName}</small>
                        </div>
                    </div>
                `;
            });

            chatContainer.scrollTop = chatContainer.scrollHeight;
        });
}

// Send Reply
async function sendReply() {
    const input = document.getElementById('adminReplyInput');
    const content = input.value.trim();

    if (!content || !selectedTicketId) return;

    try {
        input.disabled = true;

        await db.collection('tickets').doc(selectedTicketId).collection('messages').add({
            content: content,
            senderId: currentUser.uid,
            senderName: 'الدعم الفني',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            isAdmin: true
        });

        // Update ticket
        await db.collection('tickets').doc(selectedTicketId).update({
            lastMessage: content,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'open', // Auto re-open on reply
            hasUnread: false // Mark as read by admin/replied
        });

        input.value = '';
        input.focus();

    } catch (error) {
        console.error(error);
        alert('فشل الإرسال');
    } finally {
        input.disabled = false;
    }
}

// Toggle Status
async function toggleTicketStatus() {
    if (!selectedTicketId) return;

    const btn = document.getElementById('closeTicketBtn');
    const isClosed = btn.textContent === 'إعادة فتح';
    const newStatus = isClosed ? 'open' : 'closed';

    try {
        await db.collection('tickets').doc(selectedTicketId).update({
            status: newStatus
        });

        // Update UI
        if (newStatus === 'closed') {
            btn.textContent = 'إعادة فتح';
            btn.className = 'btn btn-primary btn-small';
        } else {
            btn.textContent = 'إغلاق التذكرة';
            btn.className = 'btn btn-secondary btn-small';
        }

        loadTickets(); // Refresh list to update badges

    } catch (error) {
        console.error(error);
        alert('فشل تحديث الحالة');
    }
}

function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleString('ar-EG');
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Setup enter key
document.getElementById('adminReplyInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendReply();
    }
});
