
const firebaseConfig = {
    apiKey: "AIzaSyCIXeX6Y7ju_kLtPqdHnnFNpJWVpP-wZIA",
    authDomain: "pulse-pm-234d4.firebaseapp.com",
    projectId: "pulse-pm-234d4",
    storageBucket: "pulse-pm-234d4.firebasestorage.app",
    messagingSenderId: "649086479695",
    appId: "1:649086479695:web:8fd84685597bff34f3293a",
    measurementId: "G-9RRWNX9RSM"
};


firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();


const tabSignIn = document.getElementById('tab-signin');
const tabSignUp = document.getElementById('tab-signup');
const signinWrapper = document.getElementById('signin-wrapper');
const signupWrapper = document.getElementById('signup-wrapper');

tabSignIn.addEventListener('click', () => {
    tabSignIn.classList.add('active');
    tabSignUp.classList.remove('active');
    signinWrapper.classList.add('active');
    signupWrapper.classList.remove('active');
});

tabSignUp.addEventListener('click', () => {
    tabSignUp.classList.add('active');
    tabSignIn.classList.remove('active');
    signupWrapper.classList.add('active');
    signinWrapper.classList.remove('active');
});




const registerForm = document.getElementById('register-form');
registerForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent page reload

    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const fullName = document.getElementById('signup-name').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            
            alert("Account created successfully! Switching to Sign In...");
            
           
            const user = userCredential.user;
            user.updateProfile({
                displayName: fullName
            });

            
            registerForm.reset();
            tabSignIn.click(); 
        })
        .catch((error) => {
            alert("Error during sign up: " + error.message);
        });
});

// 2. SIGN IN (Login)
const loginForm = document.getElementById('login-form');
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Login successful
            alert("Welcome back! Redirecting to Dashboard...");
            
            
            window.location.href = "dashboard.html"; 
        })
        .catch((error) => {
            alert("Error during sign in: " + error.message);
        });
});