// admin/js/tickets.js

let selectedTicketId = null;
let messagesUnsubscribe = null;

// Expose functions to global scope immediately
window.loadTickets = loadTickets;
window.selectTicket = selectTicket;
window.sendReply = sendReply;
window.closeTicket = closeTicket;
window.reopenTicket = reopenTicket;
window.deleteTicket = deleteTicket;
window.formatDateTime = formatDateTime;

// Auth Check
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Expose functions immediately
        window.loadTickets = loadTickets;
        window.selectTicket = selectTicket;
        window.sendReply = sendReply;
        window.closeTicket = closeTicket;
        window.reopenTicket = reopenTicket;
        window.deleteTicket = deleteTicket;
        window.formatDateTime = formatDateTime;
        
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
    
    try {
        let query = db.collection('support_tickets').orderBy('updatedAt', 'desc');
        
        if (filter !== 'all') {
            query = query.where('status', '==', filter);
        }
        
        const snapshot = await query.get();
        const tickets = [];
        
        snapshot.forEach(doc => {
            tickets.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        renderTickets(tickets);
        
    } catch (error) {
        console.error('Error loading tickets:', error);
        list.innerHTML = '<div class="ticket-item">حدث خطأ أثناء تحميل التذاكر</div>';
    }
}

function renderTickets(tickets) {
    const list = document.getElementById('ticketsList');
    
    if (tickets.length === 0) {
        list.innerHTML = '<div class="ticket-item">لا توجد تذاكر</div>';
        return;
    }
    
    list.innerHTML = tickets.map(ticket => `
        <div class="ticket-item ${selectedTicketId === ticket.id ? 'active' : ''}" 
             onclick="selectTicket('${ticket.id}')">
            <div class="ticket-header">
                <div class="ticket-title">${ticket.subject}</div>
                <div class="ticket-status ${ticket.status}">
                    ${getStatusText(ticket.status)}
                </div>
            </div>
            <div class="ticket-preview">
                ${ticket.messages[0]?.content.substring(0, 50) || 'لا توجد رسائل'}...
            </div>
            <div class="ticket-meta">
                <span>${ticket.userName || 'مستخدم'}</span>
                <span>${formatDateTime(ticket.updatedAt)}</span>
            </div>
        </div>
    `).join('');
}

async function selectTicket(ticketId) {
    selectedTicketId = ticketId;
    
    // Highlight selected ticket
    document.querySelectorAll('.ticket-item').forEach(item => {
        item.classList.remove('active');
    });
    event?.target?.closest('.ticket-item')?.classList?.add('active');
    
    try {
        const ticketDoc = await db.collection('support_tickets').doc(ticketId).get();
        const ticket = ticketDoc.data();
        
        if (!ticket) {
            showMessage('التذكرة غير موجودة', 'error');
            return;
        }
        
        renderTicketDetails(ticket);
        loadMessages(ticketId);
        
    } catch (error) {
        console.error('Error loading ticket:', error);
        showMessage('حدث خطأ أثناء تحميل التذكرة', 'error');
    }
}

function renderTicketDetails(ticket) {
    const details = document.getElementById('ticketDetails');
    details.innerHTML = `
        <div class="ticket-detail-header">
            <h3>${ticket.subject}</h3>
            <div class="ticket-detail-meta">
                <span>المستخدم: ${ticket.userName || 'غير محدد'}</span>
                <span>البريد: ${ticket.userEmail || 'غير محدد'}</span>
                <span>تاريخ الإنشاء: ${formatDateTime(ticket.createdAt)}</span>
            </div>
            <div class="ticket-actions">
                ${ticket.status === 'open' ? `
                    <button class="btn btn-warning" onclick="closeTicket('${ticket.id}')">إغلاق التذكرة</button>
                ` : ticket.status === 'closed' ? `
                    <button class="btn btn-success" onclick="reopenTicket('${ticket.id}')">إعادة فتح التذكرة</button>
                ` : ''}
                <button class="btn btn-danger" onclick="deleteTicket('${ticket.id}')">حذف التذكرة</button>
            </div>
        </div>
    `;
}

function loadMessages(ticketId) {
    // Unsubscribe from previous listener if exists
    if (messagesUnsubscribe) {
        messagesUnsubscribe();
    }
    
    const messagesContainer = document.getElementById('ticketMessages');
    messagesContainer.innerHTML = '<div class="loading">جاري تحميل الرسائل...</div>';
    
    // Listen for messages updates
    messagesUnsubscribe = db.collection('support_tickets').doc(ticketId)
        .onSnapshot(async (doc) => {
            if (!doc.exists) return;
            
            const ticket = doc.data();
            renderMessages(ticket.messages || []);
        }, (error) => {
            console.error('Error listening to messages:', error);
            messagesContainer.innerHTML = '<div class="error">حدث خطأ أثناء تحميل الرسائل</div>';
        });
}

function renderMessages(messages) {
    const container = document.getElementById('ticketMessages');
    
    if (!messages || messages.length === 0) {
        container.innerHTML = '<div class="no-messages">لا توجد رسائل</div>';
        return;
    }
    
    container.innerHTML = messages.map(msg => `
        <div class="message ${msg.senderType}">
            <div class="message-header">
                <strong>${msg.senderType === 'user' ? msg.senderName || 'المستخدم' : 'الإدارة'}</strong>
                <span>${formatDateTime(msg.timestamp)}</span>
            </div>
            <div class="message-content">
                ${msg.content}
            </div>
        </div>
    `).join('');
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

async function sendReply() {
    const input = document.getElementById('replyInput');
    const content = input.value.trim();
    
    if (!content || !selectedTicketId) return;
    
    try {
        const admin = auth.currentUser;
        if (!admin) {
            showMessage('يجب تسجيل الدخول كمسؤول', 'error');
            return;
        }
        
        const reply = {
            senderType: 'admin',
            senderName: 'الإدارة',
            content: content,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('support_tickets').doc(selectedTicketId).update({
            messages: firebase.firestore.FieldValue.arrayUnion(reply),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'open' // Reopen if closed
        });
        
        input.value = '';
        showMessage('تم إرسال الرد بنجاح', 'success');
        
    } catch (error) {
        console.error('Error sending reply:', error);
        showMessage('حدث خطأ أثناء إرسال الرد', 'error');
    }
}

async function closeTicket(ticketId) {
    if (!confirm('هل أنت متأكد من إغلاق هذه التذكرة؟')) return;
    
    try {
        await db.collection('support_tickets').doc(ticketId).update({
            status: 'closed',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showMessage('تم إغلاق التذكرة', 'success');
        loadTickets();
        
    } catch (error) {
        console.error('Error closing ticket:', error);
        showMessage('حدث خطأ أثناء إغلاق التذكرة', 'error');
    }
}

async function reopenTicket(ticketId) {
    if (!confirm('هل أنت متأكد من إعادة فتح هذه التذكرة؟')) return;
    
    try {
        await db.collection('support_tickets').doc(ticketId).update({
            status: 'open',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showMessage('تم إعادة فتح التذكرة', 'success');
        loadTickets();
        
    } catch (error) {
        console.error('Error reopening ticket:', error);
        showMessage('حدث خطأ أثناء إعادة فتح التذكرة', 'error');
    }
}

async function deleteTicket(ticketId) {
    if (!confirm('هل أنت متأكد من حذف هذه التذكرة؟ هذا الإجراء لا يمكن التراجع عنه.')) return;
    
    try {
        await db.collection('support_tickets').doc(ticketId).delete();
        
        showMessage('تم حذف التذكرة', 'success');
        selectedTicketId = null;
        document.getElementById('ticketDetails').innerHTML = '';
        document.getElementById('ticketMessages').innerHTML = '';
        loadTickets();
        
    } catch (error) {
        console.error('Error deleting ticket:', error);
        showMessage('حدث خطأ أثناء حذف التذكرة', 'error');
    }
}

function getStatusText(status) {
    const statuses = {
        'open': 'مفتوحة',
        'closed': 'مغلقة',
        'pending': 'معلقة'
    };
    return statuses[status] || status;
}

function formatDateTime(timestamp) {
    if (!timestamp) return 'غير محدد';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Make functions globally available
window.loadTickets = loadTickets;
window.selectTicket = selectTicket;
window.sendReply = sendReply;
window.closeTicket = closeTicket;
window.reopenTicket = reopenTicket;
window.deleteTicket = deleteTicket;
window.formatDateTime = formatDateTime;