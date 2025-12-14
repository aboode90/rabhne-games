// Script to add Foxy Eco Sort game directly to Firestore
// This script can be run in the browser console or as a standalone page

// Game data for Foxy Eco Sort
const gameData = {
    title: "Foxy Eco Sort",
    slug: "foxy-eco-sort",
    iframeUrl: "https://html5.gamedistribution.com/rvvASWA4/8e3527971f5c4457b0691897f02111bb/index.html",
    thumbnailUrl: "https://img.gamedistribution.com/8e3527971f5c4457b0691897f02111bb-512x384.jpeg",
    category: "puzzle",
    isActive: true,
    plays: 0,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
};

// Function to add game to Firestore
async function addFoxyEcoSortGame() {
    try {
        // Initialize Firebase if not already initialized
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        // Get Firestore instance
        const db = firebase.firestore();
        
        // Check if game already exists
        const existingGame = await db.collection('games')
            .where('slug', '==', gameData.slug)
            .get();
            
        if (!existingGame.empty) {
            console.log('Game already exists with ID:', existingGame.docs[0].id);
            return { success: false, message: 'اللعبة موجودة بالفعل' };
        }
        
        // Add game to Firestore
        const docRef = await db.collection('games').add(gameData);
        console.log('Game added with ID:', docRef.id);
        
        return { success: true, message: 'تمت إضافة اللعبة بنجاح', id: docRef.id };
        
    } catch (error) {
        console.error('Error adding game:', error);
        return { success: false, message: 'حدث خطأ: ' + error.message };
    }
}

// Function to run in browser console
function runInConsole() {
    // Check if user is logged in as admin
    const user = firebase.auth().currentUser;
    if (!user) {
        console.log('Please log in as admin first');
        return;
    }
    
    // Run the function
    addFoxyEcoSortGame().then(result => {
        console.log(result.message);
        if (result.success) {
            console.log('Game ID:', result.id);
        }
    });
}

// Export functions for use
window.addFoxyEcoSortGame = addFoxyEcoSortGame;
window.runInConsole = runInConsole;

// Display instructions
console.log('لإضافة لعبة Foxy Eco Sort:');
console.log('1. تأكد من تسجيل الدخول كمسؤول');
console.log('2. اكتب runInConsole() في وحدة التحكم للمتصفح');
console.log('3. أو استدعِ addFoxyEcoSortGame() مباشرة');

// If running in a browser with Firebase already initialized
if (typeof window !== 'undefined' && firebase && firebase.auth) {
    console.log('Ready to add Foxy Eco Sort game. Call runInConsole() to execute.');
}