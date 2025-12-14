// support.js

let currentTicketId = null;
let messagesUnsubscribe = null;

// Initialize when auth is ready
auth.onAuthStateChanged((user) => {
    if (user) {
        loadTickets();
    } else {
        window.location.href = '/';
    }
});

// UI helpers
function showNewTicketModal() {
    document.getElementById('newTicketModal').style.display = 'block';
}

function closeNewTicketModal() {
    document.getElementById('newTicketModal').style.display = 'none';
}

// Create Ticket
async function createTicket(e) {
    e.preventDefault();
    
    const subject = document.getElementById('ticketSubject').value;
    const message = document.getElementById('ticketMessage').value;
    const btn = e.target.querySelector('button[type="submit"]');
    
    if (!subject || !message) return;
    
    try {
        btn.disabled = true;
        btn.textContent = 'جاري الإرسال...';
        
        const ticketData = {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            userName: currentUser.displayName || 'مستخدم',
            subject: subject,
            status: 'open',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastMessage: message,
            hasUnread: true // For admin
        };
        
        // Add ticket
        const ticketRef = await db.collection('tickets').add(ticketData);
        
        // Add first message
        await ticketRef.collection('messages').add({
            content: message,
            senderId: currentUser.uid,
            senderName: currentUser.displayName || 'مستخدم',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            isAdmin: false
        });
        
        closeNewTicketModal();
        document.getElementById('newTicketForm').reset();
        
        // Refresh list
        loadTickets();
        showMessage('تم إنشاء التذكرة بنجاح', 'success');
        
    } catch (error) {
        console.error(error);
        showMessage('حدث خطأ أثناء إنشاء التذكرة', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'إرسال التذكرة';
    }
}

// Load Tickets
async function loadTickets() {
    const list = document.getElementById('ticketsList');
    const loading = document.getElementById('loadingTickets');
    
    list.innerHTML = '';
    loading.style.display = 'block';
    
    try {
        const snapshot = await db.collection('tickets')
            .where('userId', '==', currentUser.uid)
            .orderBy('updatedAt', 'desc')
            .get();
            
        loading.style.display = 'none';
        
        if (snapshot.empty) {
            list.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">ليس لديك تذاكر حالياً</p>';
            return;
        }
        
        snapshot.forEach(doc => {
            const ticket = doc.data();
            list.innerHTML += `
                <div class="ticket-card" onclick="openTicket('${doc.id}', '${ticket.subject}', '${ticket.status}')">
                    <div>
                        <h3 style="margin: 0 0 5px 0; font-size: 1.1em;">${escapeHtml(ticket.subject)}</h3>
                        <p style="margin: 0; font-size: 0.9em; color: #666;">${escapeHtml(ticket.lastMessage).substring(0, 50)}...</p>
                        <small style="color: #999;">${formatDate(ticket.updatedAt)}</small>
                    </div>
                    <span class="ticket-status status-${ticket.status}">
                        ${getStatusText(ticket.status)}
                    </span>
                </div>
            `;
        });
        
    } catch (error) {
        console.error(error);
        loading.style.display = 'none';
        list.innerHTML = '<p style="text-align: center; color: red;">حدث خطأ في تحميل التذاكر</p>';
    }
}

// Open Chat View
function openTicket(ticketId, subject, status) {
    currentTicketId = ticketId;
    
    document.getElementById('ticketsListView').style.display = 'none';
    document.getElementById('chatView').style.display = 'flex';
    document.getElementById('currentTicketSubject').textContent = subject;
    
    const statusEl = document.getElementById('currentTicketStatus');
    statusEl.className = `ticket-status status-${status}`;
    statusEl.textContent = getStatusText(status);
    
    loadMessages(ticketId);
}

function closeChatView() {
    currentTicketId = null;
    if (messagesUnsubscribe) messagesUnsubscribe();
    
    document.getElementById('chatView').style.display = 'none';
    document.getElementById('ticketsListView').style.display = 'block';
    loadTickets(); // Refresh to see updates
}

// Load Messages (Real-time)
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
                const isMe = msg.senderId === currentUser.uid;
                
                chatContainer.innerHTML += `
                    <div class="message ${isMe ? 'user' : 'support'}">
                        <div class="msg-content">
                            ${escapeHtml(msg.content)}
                            <span class="msg-time">${formatDate(msg.timestamp)}</span>
                        </div>
                    </div>
                `;
            });
            
            chatContainer.scrollTop = chatContainer.scrollHeight;
        });
}

// Send Message
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    
    if (!content || !currentTicketId) return;
    
    try {
        input.disabled = true;
        
        await db.collection('tickets').doc(currentTicketId).collection('messages').add({
            content: content,
            senderId: currentUser.uid,
            senderName: currentUser.displayName || 'مستخدم',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            isAdmin: false
        });
        
        // Update ticket last message
        await db.collection('tickets').doc(currentTicketId).update({
            lastMessage: content,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'open', // Re-open if it was closed (optional logic)
            hasUnread: true
        });
        
        input.value = '';
        input.focus();
        
    } catch (error) {
        console.error(error);
        showMessage('فشل إرسال الرسالة', 'error');
    } finally {
        input.disabled = false;
    }
}

// Helpers
function getStatusText(status) {
    const statusMap = {
        'open': 'مفتوحة',
        'pending': 'قيد المراجعة',
        'closed': 'مغلقة'
    };
    return statusMap[status] || status;
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

// Setup enter key for chat
document.getElementById('messageInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
