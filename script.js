// === ORIGINAL NON-FIREBASE CODE (UNCHANGED) ===

// Global Error Handler
window.onerror = function(msg, url, lineNo, columnNo, error) {
  console.error('JoyVibe: Global error:', msg, 'Line:', lineNo, 'Column:', columnNo, 'Error:', error, 'Stack:', error?.stack);
  showError('Site issue detected. Check console (F12).');
  return false;
};

// Error Display
function showError(message) {
  const errorMessage = document.getElementById('error-message');
  if (errorMessage) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  }
}

// Starry Background
function initStars() {
  try {
    console.log('JoyVibe: Initializing starry background');
    const starsCanvas = document.getElementById('stars-canvas');
    if (!starsCanvas) {
      console.error('JoyVibe: stars-canvas not found');
      return;
    }
    const starsCtx = starsCanvas.getContext('2d');
    if (!starsCtx) {
      console.error('JoyVibe: Failed to get stars canvas context');
      return;
    }
    starsCanvas.width = window.innerWidth;
    starsCanvas.height = window.innerHeight;
    console.log('JoyVibe: Stars canvas set:', starsCanvas.width, 'x', starsCanvas.height);

    const stars = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * starsCanvas.width,
        y: Math.random() * starsCanvas.height,
        radius: Math.random() * 1.5,
        opacity: Math.random() * 0.5 + 0.5,
        twinkleSpeed: Math.random() * 0.02 + 0.01
      });
    }

    function animateStars() {
      try {
        starsCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
        stars.forEach(star => {
          star.opacity += Math.sin(Date.now() * star.twinkleSpeed) * 0.1;
          if (star.opacity < 0.3) star.opacity = 0.3;
          if (star.opacity > 1) star.opacity = 1;
          starsCtx.beginPath();
          starsCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
          starsCtx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
          starsCtx.fill();
        });
        requestAnimationFrame(animateStars);
      } catch (err) {
        console.error('JoyVibe: Error in animateStars:', err);
      }
    }

    window.addEventListener('resize', () => {
      try {
        starsCanvas.width = window.innerWidth;
        starsCanvas.height = window.innerHeight;
        stars.forEach(star => {
          star.x = Math.random() * starsCanvas.width;
          star.y = Math.random() * starsCanvas.height;
        });
      } catch (err) {
        console.error('JoyVibe: Error in resize handler:', err);
      }
    });

    animateStars();
    console.log('JoyVibe: Starry background started');
  } catch (err) {
    console.error('JoyVibe: Error in initStars:', err);
  }
}

// Toggle Mobile Menu
function toggleMenu() {
  try {
    console.log('JoyVibe: Toggling mobile menu');
    const navLinks = document.getElementById('nav-links');
    const menuToggle = document.querySelector('.menu-toggle');
    if (!navLinks || !menuToggle) {
      console.error('JoyVibe: nav-links or menu-toggle missing');
      return;
    }
    const isExpanded = navLinks.classList.toggle('show');
    menuToggle.setAttribute('aria-expanded', isExpanded);
    console.log('JoyVibe: Menu expanded:', isExpanded);
  } catch (err) {
    console.error('JoyVibe: Error in toggleMenu:', err);
  }
}

// Navigation
function showSection(sectionId) {
  try {
    console.log('JoyVibe: Showing section:', sectionId);
    const sections = document.querySelectorAll('.section');
    if (!sections.length) {
      console.error('JoyVibe: No sections found');
      return;
    }
    sections.forEach(s => {
      s.classList.toggle('hidden', s.id !== sectionId);
    });
    if (sectionId === 'feed') {
      console.log('JoyVibe: Loading feed for section:', sectionId);
      loadFeed('newest');
    }
    if (sectionId === 'cloud') {
      console.log('JoyVibe: Initializing cloud for section:', sectionId);
      initCloud();
    }
    if (sectionId === 'landing') {
      console.log('JoyVibe: Loading recent posts for section:', sectionId);
      loadRecentPosts();
    }
    closeAllExpandedBubbles();
  } catch (err) {
    console.error('JoyVibe: Error in showSection:', err);
    showError('Failed to switch sections.');
  }
}

// Sanitize Text
function sanitizeText(text) {
  try {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  } catch (err) {
    console.error('JoyVibe: Error in sanitizeText:', err);
    return text;
  }
}

// Create Bubble
function createBubble(post, isCloud = false) {
  try {
    console.log('JoyVibe: Creating bubble for post:', post.id, 'isCloud:', isCloud);
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.dataset.postId = post.id;
    let text;

    if (!isCloud) {
      const isExpanded = expandedBubbleId === post.id;
      bubble.classList.toggle('expanded', isExpanded);
      // Use a fallback if message or text is missing
      const postText = post.message || post.text || 'No content available';
      if (isExpanded) {
        text = sanitizeText(postText);
        const textLength = postText.length;
        const size = Math.min(800, 300 + (textLength / 614) * 500);
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.dataset.baseSize = size;
        console.log('JoyVibe: Expanded bubble size:', size);
      } else {
        const words = postText.split(' ').slice(0, 5).join(' ');
        text = words.length > 30 ? words.slice(0, 27) + '...' : words + (postText.length > words.length ? '...' : '');
        text = sanitizeText(text);
      }
      bubble.innerHTML = `
        <div class="bubble-content">
          <p>${text}</p>
          <div class="actions">
            <span onclick="event.stopPropagation(); likePost('${post.id}')">❤️ ${post.likes || 0}</span>
            <span onclick="event.stopPropagation(); dislikePost('${post.id}')">💔 ${post.dislikes || 0}</span>
            <span onclick="event.stopPropagation(); sharePost('${post.id}')">📤 Share</span>
          </div>
        </div>
        ${isExpanded ? '<button class="close-button">Close</button>' : ''}
      `;
      if (isExpanded) {
        const closeButton = bubble.querySelector('.close-button');
        closeButton.addEventListener('click', (e) => {
          e.stopPropagation();
          closeAllExpandedBubbles();
        });
        let scale = 1;
        let startDistance = 0;
        let translateY = 0;
        let startY = 0;
        bubble.addEventListener('touchstart', e => {
          if (e.touches.length === 2) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            startDistance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
          } else if (e.touches.length === 1) {
            startY = e.touches[0].clientY;
          }
        });
        bubble.addEventListener('touchmove', e => {
          e.preventDefault();
          const content = bubble.querySelector('.bubble-content');
          if (e.touches.length === 2) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const currentDistance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
            scale = Math.min(1.5, Math.max(0.8, scale * (currentDistance / startDistance)));
            const baseSize = parseFloat(bubble.dataset.baseSize);
            bubble.style.width = `${baseSize * scale}px`;
            bubble.style.height = `${baseSize * scale}px`;
            content.style.maxHeight = `${(baseSize * scale) - 100}px`;
            startDistance = currentDistance;
          } else if (e.touches.length === 1) {
            const currentY = e.touches[0].clientY;
            const maxTranslate = -(content.offsetHeight - (bubble.offsetHeight - 100));
            translateY = Math.min(0, Math.max(maxTranslate, translateY + (currentY - startY)));
            content.style.transform = `translateY(${translateY}px)`;
            startY = currentY;
          }
        });
      }
      bubble.addEventListener('click', (e) => {
        const isAction = e.target.closest('.actions') || e.target.classList.contains('close-button');
        if (!isAction && !isCloud && !bubble.classList.contains('expanded')) {
          showExpandedBubble(post, bubble.parentElement.id, bubble);
          e.stopPropagation();
        }
      });
    }
    return bubble;
  } catch (err) {
    console.error('JoyVibe: Error in createBubble:', err);
    return document.createElement('div');
  }
}

// Observe Bubbles
function observeBubbles() {
  try {
    console.log('JoyVibe: Observing bubbles');
    const bubbles = document.querySelectorAll('.bubble:not(.expanded)');
    if (!bubbles.length) {
      console.warn('JoyVibe: No bubbles to observe');
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    bubbles.forEach(bubble => observer.observe(bubble));
    console.log('JoyVibe: Bubbles observed:', bubbles.length);
  } catch (err) {
    console.error('JoyVibe: Error in observeBubbles:', err);
  }
}

// Quick Post
async function quickPost() {
  try {
    console.log('JoyVibe: Quick post attempt');
    const textArea = document.getElementById('quick-post');
    if (!textArea) {
      console.error('JoyVibe: quick-post textarea missing');
      alert('Error: Textarea not found.');
      return;
    }
    const text = textArea.value.trim();
    if (!text) {
      alert('Please enter a post.');
      return;
    }

    const user = firebase.auth().currentUser;
    if (!user) {
      showError('User not authenticated. Please refresh the page and try again.');
      return;
    }
    const userId = user.uid;

    // Check for recent posts by this user (30-minute rule)
    const postsRef = firebase.firestore().collection('posts');
    const recentPostsQuery = postsRef
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(1);

    const recentPostsSnapshot = await recentPostsQuery.get();
    if (!recentPostsSnapshot.empty) {
      const lastPost = recentPostsSnapshot.docs[0].data();
      const lastPostTimestamp = lastPost.timestamp.toDate();
      const now = new Date();
      const timeDiffMinutes = (now - lastPostTimestamp) / (1000 * 60); // Convert to minutes

      if (timeDiffMinutes < 30) {
        const minutesLeft = Math.ceil(30 - timeDiffMinutes);
        showError(`Please wait ${minutesLeft} more minute(s) before posting again.`);
        return;
      }
    }

    // Submit the post
    const result = await submitPost(text, userId);
    textArea.value = '';
    if (result && result.id.startsWith('local-')) {
      alert('Post saved offline and will sync when online.');
    } else {
      alert('Post submitted successfully!');
    }
    loadRecentPosts();
  } catch (err) {
    console.error('JoyVibe: Error in quickPost:', err);
    alert('Failed to post: ' + (err.message || 'Check console for details.'));
  }
}

// Share Post
function sharePost(id) {
  try {
    const url = `https://joyvibe.world/?post=${id}`;
    navigator.clipboard.writeText(url).then(() => {
      console.log('JoyVibe: URL copied');
      alert('Link copied to clipboard!');
    }).catch(err => {
      console.error('JoyVibe: Clipboard error:', err);
      alert('Failed to copy link. Please try again.');
    });
  } catch (err) {
    console.error('JoyVibe: Error in sharePost:', err);
  }
}

// Expanded Bubble Functions
async function showExpandedBubble(post, containerId, bubbleElement) {
  try {
    console.log('JoyVibe: Showing expanded bubble for post:', post.id);
    closeAllExpandedBubbles();
    expandedBubbleId = post.id;
    originalContainerId = containerId;
    originalBubble = bubbleElement;

    if (!post.id.startsWith('local-') && firebaseInitialized && db && postsCollectionRef) {
      const user = firebase.auth().currentUser;
      const userId = user ? user.uid : null;
      if (userId) {
        const reactionDoc = await postsCollectionRef.doc(post.id).collection('reactions').doc(userId).get();
        post.userAction = reactionDoc.exists ? reactionDoc.data().type : null;
      }
    }

    if (bubbleElement) {
      bubbleElement.style.display = 'none';
    }

    const bubble = createBubble(post);
    bubble.classList.add('expanded');
    bubble.style.position = 'fixed';
    bubble.style.top = '50%';
    bubble.style.left = '50%';
    bubble.style.transform = 'translate(-50%, -50%)';
    bubble.style.zIndex = '1000';

    cloudPaused = containerId === 'cloud-canvas';
    document.body.appendChild(bubble);
  } catch (err) {
    console.error('JoyVibe: Error in showExpandedBubble:', err);
  }
}

function closeAllExpandedBubbles() {
  try {
    console.log('JoyVibe: Closing all expanded bubbles');
    const expandedBubbles = document.querySelectorAll('.bubble.expanded');
    expandedBubbles.forEach(bubble => {
      const containerId = originalContainerId || (bubble.closest('#cloud') ? 'cloud-canvas' : null);
      bubble.remove();
      if (containerId === 'cloud-canvas') {
        cloudPaused = false;
        if (canvas) requestAnimationFrame(animate);
      } else if (originalBubble && originalContainerId) {
        originalBubble.style.display = '';
      }
    });
    expandedBubbleId = null;
    originalBubble = null;
    originalContainerId = null;
  } catch (err) {
    console.error('JoyVibe: Error in closeAllExpandedBubbles:', err);
  }
}

// Dream-Cloud Animation
function animate() {
  if (cloudPaused || !ctx || !canvas) {
    console.log('JoyVibe: Animation paused or canvas not ready');
    return;
  }
  try {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    bubbles.forEach(b => {
      b.x += b.vx;
      b.y += b.vy;
      b.vx *= 0.998;
      b.vy *= 0.998;
      const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if (speed < 0.05) {
        b.vx += (Math.random() - 0.5) * 0.2;
        b.vy += (Math.random() - 0.5) * 0.2;
      }
      if (b.x - b.radius < 0 || b.x + b.radius > canvas.width) b.vx = -b.vx * 0.8;
      if (b.y - b.radius < 0 || b.y + b.radius > canvas.height) b.vy = -b.vy * 0.8;

      b.pulse = b.pulse || 0;
      b.pulse += 0.05;
      const pulseScale = 1 + Math.sin(b.pulse) * 0.05;
      const isHovered = b.id === hoveredBubbleId;
      const hoverScale = isHovered ? 1.1 : 1;
      const radius = b.radius * pulseScale * hoverScale;

      const gradient = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, radius);
      gradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
      gradient.addColorStop(0.7, 'rgba(255, 215, 0, 0.6)');
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.beginPath();
      ctx.arc(b.x, b.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.shadowBlur = isHovered ? 15 : 10;
      ctx.shadowColor = isHovered ? 'rgba(255, 255, 200, 0.9)' : 'rgba(255, 255, 200, 0.8)';
      ctx.fill();
      ctx.shadowBlur = isHovered ? 50 : 40;
      ctx.shadowColor = isHovered ? 'rgba(255, 215, 0, 0.7)' : 'rgba(255, 215, 0, 0.5)';
      ctx.fill();

      ctx.globalAlpha = isHovered ? 0.8 : 0.6;
      ctx.beginPath();
      ctx.arc(b.x - radius * 0.4, b.y - radius * 0.4, radius * (isHovered ? 0.3 : 0.2), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fill();
      ctx.globalAlpha = 1;

      if (isHovered) {
        ctx.beginPath();
        ctx.moveTo(b.x - radius * 0.6, b.y - radius * 0.6);
        ctx.lineTo(b.x - radius * 0.2, b.y - radius * 0.2);
        ctx.moveTo(b.x + radius * 0.6, b.y + radius * 0.6);
        ctx.lineTo(b.x + radius * 0.2, b.y + radius * 0.2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.fillStyle = '#333';
      ctx.font = '14px Poppins';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.text || 'Post', b.x, b.y - 10);
      ctx.fillText(`❤️ ${b.likes || 0}`, b.x, b.y + 10);
      ctx.shadowBlur = 0;
    });

    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const b1 = bubbles[i];
        const b2 = bubbles[j];
        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < b1.radius + b2.radius) {
          const angle = Math.atan2(dy, dx);
          const sin = Math.sin(angle);
          const cos = Math.cos(angle);
          const vx1 = b1.vx * cos + b1.vy * sin;
          const vy1 = b1.vy * cos - b1.vx * sin;
          const vx2 = b2.vx * cos + b2.vy * sin;
          const vy2 = b2.vy * cos - b2.vx * sin;
          b1.vx = vx2 * cos - vy1 * sin * 0.8;
          b1.vy = vy1 * cos + vx2 * sin * 0.8;
          b2.vx = vx1 * cos - vy2 * sin * 0.8;
          b2.vy = vy2 * cos + vx1 * sin * 0.8;
        }
      }
    }

    requestAnimationFrame(animate);
  } catch (err) {
    console.error('JoyVibe: Error in animate:', err);
  }
}

// Cloud Controls
function toggleCloudPause() {
  try {
    console.log('JoyVibe: Toggling cloud pause');
    cloudPaused = !cloudPaused;
    const pauseButton = document.getElementById('pause-cloud');
    pauseButton.innerText = cloudPaused ? '▶️' : '⏸️';
    if (!cloudPaused && canvas && ctx) {
      console.log('JoyVibe: Resuming cloud animation');
      requestAnimationFrame(animate);
    }
  } catch (err) {
    console.error('JoyVibe: Error in toggleCloudPause:', err);
  }
}

// Update Bubble
async function updateBubble(post) {
  try {
    console.log('JoyVibe: Updating bubble for post:', post.id);
    const bubbles = document.querySelectorAll(`.bubble[data-post-id="${post.id}"]`);
    bubbles.forEach(bubble => {
      const isExpanded = bubble.classList.contains('expanded');
      const isLiked = post.userAction === 'liked';
      const isDisliked = post.userAction === 'disliked';
      const text = isExpanded ? sanitizeText(post.message || post.text) : sanitizeText((post.message || post.text).split(' ').slice(0, 5).join(' ')) + ((post.message || post.text).length > 30 ? '...' : '');
      bubble.querySelector('.bubble-content').innerHTML = `
        <p>${text}</p>
        <div class="actions">
          <span class="${isLiked ? 'disabled' : ''}" onclick="event.stopPropagation(); ${isLiked ? '' : `likePost('${post.id}')`}">❤️ ${post.likes || 0}</span>
          <span class="${isDisliked ? 'disabled' : ''}" onclick="event.stopPropagation(); ${isDisliked ? '' : `dislikePost('${post.id}')`}">💔 ${post.dislikes || 0}</span>
          <span onclick="event.stopPropagation(); sharePost('${post.id}')">📤 Share</span>
        </div>
      `;
      if (isExpanded) {
        const closeButton = document.createElement('button');
        closeButton.className = 'close-button';
        closeButton.textContent = 'Close';
        closeButton.addEventListener('click', e => {
          e.stopPropagation();
          closeAllExpandedBubbles();
        });
        bubble.appendChild(closeButton);
      }
    });
  } catch (err) {
    console.error('JoyVibe: Error in updateBubble:', err);
  }
}

// Handle Outside Clicks
document.addEventListener('click', e => {
  const bubble = e.target.closest('.bubble.expanded');
  const canvas = e.target.closest('#cloud-canvas');
  const controls = e.target.closest('.cloud-controls');
  const nav = e.target.closest('nav');
  const isAction = e.target.closest('.actions') || e.target.classList.contains('close-button');
  if (!bubble && !canvas && !controls && !nav && !isAction && expandedBubbleId) {
    console.log('JoyVibe: Closing expanded bubbles due to outside click');
    closeAllExpandedBubbles();
  }
});

// State
let cloudPaused = false;
let bubbles = [];
let ctx, canvas;
let hoveredBubbleId = null;
let expandedBubbleId = null;
let originalBubble = null;
let originalContainerId = null;

// === NEW COMPAT FIREBASE CODE ===

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBBJjQ8nZwPVNCPgsTg821Sr0T0PVZD2No",
  authDomain: "joyvibe-a6775.firebaseapp.com",
  projectId: "joyvibe-a6775",
  storageBucket: "joyvibe-a6775.firebasestorage.app",
  messagingSenderId: "920959691579",
  appId: "1:920959691579:web:be079e785dd4ce5a5fe51e"
};

// Initialize Firebase with Retry
let app;
let db;
let auth;
let postsCollectionRef;
let firebaseInitialized = false;
let authRetryCount = 0;
const maxAuthRetries = 3;

async function initializeFirebase() {
  try {
    console.log('JoyVibe: Attempting Firebase initialization, attempt', authRetryCount + 1);
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    postsCollectionRef = db.collection('posts');
    await auth.signInAnonymously();
    firebaseInitialized = true;
    console.log('JoyVibe: Firebase initialized successfully');
    syncLocalPosts();
    setupRealtime();
  } catch (err) {
    console.error('JoyVibe: Firebase initialization failed:', err);
    if (authRetryCount < maxAuthRetries) {
      authRetryCount++;
      console.log('JoyVibe: Retrying Firebase initialization in 2 seconds...');
      setTimeout(initializeFirebase, 2000);
    } else {
      console.error('JoyVibe: All Firebase initialization attempts failed');
      showError('Unable to connect to Firebase. Using offline mode.');
      setupOfflineFallback();
    }
  }
}

// Offline Fallback
function setupOfflineFallback() {
  console.log('JoyVibe: Setting up offline fallback');
  db = {
    collection: () => ({
      add: async (post) => {
        const localPosts = JSON.parse(localStorage.getItem('pendingPosts') || '[]');
        const id = 'local-' + Date.now();
        localPosts.push({ ...post, id, timestamp: new Date() });
        localStorage.setItem('pendingPosts', JSON.stringify(localPosts));
        console.log('JoyVibe: Post stored locally:', post);
        return { id };
      },
      orderBy: () => ({
        limit: () => ({
          get: async () => ({
            docs: JSON.parse(localStorage.getItem('pendingPosts') || '[]').map(p => ({
              id: p.id,
              data: () => p
            })),
            empty: false
          })
        }),
        get: async () => ({
          docs: JSON.parse(localStorage.getItem('pendingPosts') || '[]').map(p => ({
              id: p.id,
              data: () => p
            })),
            empty: false
          })
      }),
      doc: () => ({
        collection: () => ({
          doc: () => ({
            get: async () => ({ exists: false }),
            set: async () => {}
          })
        }),
        get: async () => ({ exists: false, data: () => ({}) }),
        update: async () => {}
      })
    })
  };
  postsCollectionRef = db.collection('posts');
}

// Sync Local Posts to Firestore
async function syncLocalPosts() {
  if (!firebaseInitialized) return;
  try {
    console.log('JoyVibe: Attempting to sync local posts and actions');
    const localPosts = JSON.parse(localStorage.getItem('pendingPosts') || '[]');
    const localActions = JSON.parse(localStorage.getItem('pendingActions') || '{}');
    if (localPosts.length === 0 && Object.keys(localActions).length === 0) {
      console.log('JoyVibe: No local posts or actions to sync');
      return;
    }

    const user = firebase.auth().currentUser;
    if (!user) {
      console.error('JoyVibe: User not authenticated during sync');
      return;
    }
    const userId = user.uid;

    // Sync posts
    for (const post of localPosts) {
      const docRef = await postsCollectionRef.add({
        message: post.text,
        likes: post.likes || 0,
        dislikes: post.dislikes || 0,
        shares: 0,
        userId: userId,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('JoyVibe: Synced local post to Firestore, new ID:', docRef.id);
      // Sync associated actions
      if (localActions[post.id]) {
        const actionUserId = localActions[post.id].userId;
        const action = localActions[post.id].action;
        await postsCollectionRef.doc(docRef.id).collection('reactions').doc(actionUserId).set({
          type: action,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('JoyVibe: Synced local action for post:', docRef.id);
        delete localActions[post.id];
      }
    }

    localStorage.setItem('pendingPosts', '[]');
    localStorage.setItem('pendingActions', JSON.stringify(localActions));
    console.log('JoyVibe: Local posts and actions synced, cleared pending');
    loadRecentPosts();
  } catch (err) {
    console.error('JoyVibe: Error syncing local posts:', err);
  }
}

// Submit Post
async function submitPost(text, userId) {
  try {
    console.log('JoyVibe: Submitting post:', text);
    if (!firebaseInitialized || !postsCollectionRef) {
      console.error('JoyVibe: Firebase not initialized in submitPost');
      throw new Error('Database service not initialized');
    }
    const post = {
      message: sanitizeText(text),
      likes: 0,
      dislikes: 0,
      shares: 0,
      userId: userId,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    const docRef = await postsCollectionRef.add(post);
    console.log('JoyVibe: Post submitted successfully, ID:', docRef.id);
    return { id: docRef.id };
  } catch (err) {
    console.error('JoyVibe: Error in submitPost:', err);
    showError('Failed to post. Saved offline.');
    const localPosts = JSON.parse(localStorage.getItem('pendingPosts') || '[]');
    const id = 'local-' + Date.now();
    localPosts.push({
      id,
      text: sanitizeText(text),
      likes: 0,
      dislikes: 0,
      shares: 0,
      userId: userId,
      timestamp: new Date()
    });
    localStorage.setItem('pendingPosts', JSON.stringify(localPosts));
    return { id };
  }
}

// Load Recent Posts
async function loadRecentPosts() {
  try {
    console.log('JoyVibe: Loading recent posts');
    const container = document.getElementById('recent-posts');
    if (!container) {
      console.error('JoyVibe: recent-posts container missing');
      showError('Failed to find recent posts container.');
      return;
    }
    container.innerHTML = '<p>Loading...</p>';

    // Wait for authentication to complete
    let user = firebase.auth().currentUser;
    if (!user) {
      await new Promise((resolve) => {
        const unsubscribe = firebase.auth().onAuthStateChanged((u) => {
          user = u;
          unsubscribe();
          resolve();
        });
      });
    }
    const userId = user ? user.uid : null;

    let posts = [];
    if (firebaseInitialized && db && postsCollectionRef) {
      try {
        const snapshot = await postsCollectionRef.orderBy('timestamp', 'desc').limit(5).get();
        posts = await Promise.all(snapshot.docs.map(async doc => {
          const data = doc.data();
          let userAction = null;
          if (userId) {
            const reactionDoc = await postsCollectionRef.doc(doc.id).collection('reactions').doc(userId).get();
            userAction = reactionDoc.exists ? reactionDoc.data().type : null;
          }
          return {
            id: doc.id,
            message: data.message,
            likes: data.likes,
            dislikes: data.dislikes,
            shares: data.shares,
            userId: data.userId,
            timestamp: data.timestamp?.toDate() || new Date(),
            userAction: userAction
          };
        }));
        console.log('JoyVibe: Fetched posts from Firebase:', posts.length);
      } catch (err) {
        console.error('JoyVibe: Firebase fetch error:', err);
        throw err; // Re-throw to handle in the outer catch block
      }
    }

    const localPosts = JSON.parse(localStorage.getItem('pendingPosts') || '[]');
    const localActions = JSON.parse(localStorage.getItem('pendingActions') || '{}');
    const localPostsWithActions = localPosts.map(post => ({
      ...post,
      userAction: localActions[post.id] ? localActions[post.id].action : null
    }));
    posts = [...localPostsWithActions, ...posts];

    container.innerHTML = '';
    if (posts.length === 0) {
      console.log('JoyVibe: No posts available, showing welcome bubble');
      posts = [{
        id: 'fallback-1',
        message: 'Welcome to JoyVibe! Share your dreams!',
        likes: 0,
        dislikes: 0,
        shares: 0,
        timestamp: new Date()
      }];
    }

    const uniquePosts = Array.from(new Map(posts.map(p => [p.id, p])).values());
    uniquePosts.forEach(post => {
      const bubble = createBubble(post);
      container.appendChild(bubble);
    });
    observeBubbles();
  } catch (err) {
    console.error('JoyVibe: Error in loadRecentPosts:', err);
    showError('Failed to load recent posts.');
    const container = document.getElementById('recent-posts');
    if (container) {
      container.innerHTML = '';
      const fallbackPost = {
        id: 'fallback-error',
        message: 'Welcome to JoyVibe! Share your dreams!',
        likes: 0,
        dislikes: 0,
        shares: 0,
        timestamp: new Date()
      };
      const bubble = createBubble(fallbackPost);
      container.appendChild(bubble);
      observeBubbles();
    }
  }
}

// Load Feed
async function loadFeed(sort) {
  try {
    console.log('JoyVibe: Loading feed:', sort);
    const container = document.getElementById('feed-posts');
    if (!container) {
      console.error('JoyVibe: feed-posts container missing');
      showError('Failed to find feed container.');
      return;
    }
    container.innerHTML = '<p>Loading...</p>';

    // Wait for authentication to complete
    let user = firebase.auth().currentUser;
    if (!user) {
      await new Promise((resolve) => {
        const unsubscribe = firebase.auth().onAuthStateChanged((u) => {
          user = u;
          unsubscribe();
          resolve();
        });
      });
    }
    const userId = user ? user.uid : null;

    let posts = [];
    if (firebaseInitialized && db && postsCollectionRef) {
      let query = postsCollectionRef;
      if (sort === 'newest') {
        query = postsCollectionRef.orderBy('timestamp', 'desc');
      } else if (sort === 'liked') {
        query = postsCollectionRef.orderBy('likes', 'desc');
      }
      const snapshot = await query.get();
      posts = await Promise.all(snapshot.docs.map(async doc => {
        const data = doc.data();
        let userAction = null;
        if (userId) {
          const reactionDoc = await postsCollectionRef.doc(doc.id).collection('reactions').doc(userId).get();
          userAction = reactionDoc.exists ? reactionDoc.data().type : null;
        }
        return {
          id: doc.id,
          message: data.message,
          likes: data.likes,
          dislikes: data.dislikes,
          shares: data.shares,
          userId: data.userId,
          timestamp: data.timestamp?.toDate() || new Date(),
          userAction: userAction
        };
      }));
      console.log('JoyVibe: Fetched feed posts:', posts.length);
    }

    const localPosts = JSON.parse(localStorage.getItem('pendingPosts') || '[]');
    const localActions = JSON.parse(localStorage.getItem('pendingActions') || '{}');
    const localPostsWithActions = localPosts.map(post => ({
      ...post,
      userAction: localActions[post.id] ? localActions[post.id].action : null
    }));
    posts = [...localPostsWithActions, ...posts];

    container.innerHTML = '';
    if (posts.length === 0) {
      console.log('JoyVibe: No feed posts, adding fallback bubble');
      posts = [{
        id: 'fallback-feed-1',
        message: 'Explore dreams on JoyVibe!',
        likes: 0,
        dislikes: 0,
        shares: 0,
        timestamp: new Date()
      }];
    }

    const uniquePosts = Array.from(new Map(posts.map(p => [p.id, p])).values());
    uniquePosts.forEach(post => {
      const bubble = createBubble(post);
      container.appendChild(bubble);
    });
    observeBubbles();
  } catch (err) {
    console.error('JoyVibe: Error in loadFeed:', err);
    showError('Failed to load feed.');
    const container = document.getElementById('feed-posts');
    if (container) {
      container.innerHTML = '';
      const fallbackPost = {
        id: 'fallback-feed-error',
        message: 'Explore dreams on JoyVibe!',
        likes: 0,
        dislikes: 0,
        shares: 0,
        timestamp: new Date()
      };
      const bubble = createBubble(fallbackPost);
      container.appendChild(bubble);
      observeBubbles();
    }
  }
}

async function likePost(id) {
  try {
    console.log('JoyVibe: Attempting to like Post ID:', id);

    if (id.startsWith('local-') || !firebaseInitialized || !postsCollectionRef) {
      // local handling stays the same
      const localPosts = JSON.parse(localStorage.getItem('pendingPosts') || '[]');
      const postData = localPosts.find(p => p.id === id);
      if (postData) {
        postData.likes = (postData.likes || 0) + 1;
        localStorage.setItem('pendingPosts', JSON.stringify(localPosts));
        updateBubble({ id, ...postData, userAction: 'like' });
      }
      return;
    }

    const user = firebase.auth().currentUser;
    if (!user) {
      showError('Please refresh the page and try again.');
      return;
    }
    const userId = user.uid;

    const postDocRef = postsCollectionRef.doc(id);
    const reactionDocRef = postDocRef.collection('reactions').doc(userId);   // ← FIXED: use user UID

    const postDoc = await postDocRef.get();
    if (!postDoc.exists) {
      showError('Post not found.');
      return;
    }

    // Optional but recommended: prevent double-like
    const existing = await reactionDocRef.get();
    if (existing.exists && existing.data().type === 'like') {
      console.log('Already liked');
      return;
    }

    await db.runTransaction(async (transaction) => {
      transaction.set(reactionDocRef, { 
        type: 'like', 
        timestamp: firebase.firestore.FieldValue.serverTimestamp() 
      });
      transaction.update(postDocRef, {
        likes: firebase.firestore.FieldValue.increment(1)
      });
    });

    console.log('Successfully liked post:', id);
    await loadRecentPosts();
    await loadFeed('newest');   // or whatever sort you want
  } catch (err) {
    console.error('JoyVibe: Error in likePost:', err);
    showError(err.message || 'Failed to like the post.');
  }
}

async function dislikePost(id) {
  try {
    console.log('JoyVibe: Attempting to dislike Post ID:', id);

    if (id.startsWith('local-') || !firebaseInitialized || !postsCollectionRef) {
      const localPosts = JSON.parse(localStorage.getItem('pendingPosts') || '[]');
      const postData = localPosts.find(p => p.id === id);
      if (postData) {
        postData.dislikes = (postData.dislikes || 0) + 1;
        localStorage.setItem('pendingPosts', JSON.stringify(localPosts));
        updateBubble({ id, ...postData, userAction: 'dislike' });
      }
      return;
    }

    const user = firebase.auth().currentUser;
    if (!user) {
      showError('Please refresh the page and try again.');
      return;
    }
    const userId = user.uid;

    const postDocRef = postsCollectionRef.doc(id);
    const reactionDocRef = postDocRef.collection('reactions').doc(userId);   // ← FIXED

    const postDoc = await postDocRef.get();
    if (!postDoc.exists) {
      showError('Post not found.');
      return;
    }

    const existing = await reactionDocRef.get();
    if (existing.exists && existing.data().type === 'dislike') {
      console.log('Already disliked');
      return;
    }

    await db.runTransaction(async (transaction) => {
      transaction.set(reactionDocRef, { 
        type: 'dislike', 
        timestamp: firebase.firestore.FieldValue.serverTimestamp() 
      });
      transaction.update(postDocRef, {
        dislikes: firebase.firestore.FieldValue.increment(1)
      });
    });

    console.log('Successfully disliked post:', id);
    await loadRecentPosts();
    await loadFeed('newest');
  } catch (err) {
    console.error('JoyVibe: Error in dislikePost:', err);
    showError(err.message || 'Failed to dislike the post.');
  }
}

// Dream-Cloud Initialization
async function initCloud() {
  try {
    console.log('JoyVibe: Initializing Dream-Cloud');
    canvas = document.getElementById('cloud-canvas');
    if (!canvas) {
      console.error('JoyVibe: cloud-canvas missing');
      showError('Failed to find cloud canvas.');
      return;
    }
    ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('JoyVibe: Failed to get canvas context');
      return;
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    console.log('JoyVibe: Cloud canvas set:', canvas.width, 'x', canvas.height);

    bubbles = [
      { id: 'cloud-fallback-1', text: 'Dream', likes: 0, x: canvas.width * 0.3, y: canvas.height * 0.3, vx: 0.5, vy: 0.5, radius: 40 },
      { id: 'cloud-fallback-2', text: 'Hope', likes: 0, x: canvas.width * 0.7, y: canvas.height * 0.7, vx: -0.5, vy: -0.5, radius: 40 }
    ];

    if (firebaseInitialized && db && postsCollectionRef) {
      const snapshot = await postsCollectionRef.orderBy('likes', 'desc').limit(20).get();
      if (!snapshot.empty) {
        const cloudPosts = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            text: data.message.split(' ')[0] || 'Post',
            likes: data.likes || 0,
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 1,
            vy: (Math.random() - 0.5) * 1,
            radius: 40
          };
        });
        bubbles = [...cloudPosts];
      }
      console.log('JoyVibe: Fetched cloud posts:', snapshot.docs.length);
    }

    const localPosts = JSON.parse(localStorage.getItem('pendingPosts') || '[]');
    localPosts.forEach(post => {
      bubbles.push({
        id: post.id,
        text: post.text.split(' ')[0] || 'Post',
        likes: post.likes || 0,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1,
        vy: (Math.random() - 0.5) * 1,
        radius: 40
      });
    });
    console.log('JoyVibe: Cloud bubbles created:', bubbles.length);

    canvas.onclick = e => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      for (let b of bubbles) {
        const dist = Math.sqrt((mouseX - b.x) ** 2 + (mouseY - b.y) ** 2);
        if (dist <= b.radius) {
          if (b.id.startsWith('local-')) {
            const localPosts = JSON.parse(localStorage.getItem('pendingPosts') || '[]');
            const post = localPosts.find(p => p.id === b.id) || {
              id: b.id,
              message: b.text,
              likes: b.likes,
              dislikes: 0,
              shares: 0,
              timestamp: new Date()
            };
            showExpandedBubble(post, 'cloud-canvas', null);
          } else if (firebaseInitialized && db && postsCollectionRef) {
            postsCollectionRef.doc(b.id).get().then(doc => {
              if (doc.exists) {
                showExpandedBubble({ id: doc.id, ...doc.data(), timestamp: doc.data().timestamp?.toDate() || new Date() }, 'cloud-canvas', null);
              }
            });
          }
          break;
        }
      }
    };

    canvas.onmousemove = e => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      hoveredBubbleId = null;
      bubbles.forEach(b => {
        const dist = Math.sqrt((mouseX - b.x) ** 2 + (mouseY - b.y) ** 2);
        if (dist <= b.radius) {
          hoveredBubbleId = b.id;
        }
      });
    };

    canvas.onmouseleave = () => {
      hoveredBubbleId = null;
    };

    canvas.ontouchstart = e => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const touchX = touch.clientX - rect.left;
      const touchY = touch.clientY - rect.top;
      for (let b of bubbles) {
        const dist = Math.sqrt((touchX - b.x) ** 2 + (touchY - b.y) ** 2);
        if (dist <= b.radius) {
          if (b.id.startsWith('local-')) {
            const localPosts = JSON.parse(localStorage.getItem('pendingPosts') || '[]');
            const post = localPosts.find(p => p.id === b.id) || {
              id: b.id,
              message: b.text,
              likes: b.likes,
              dislikes: 0,
              shares: 0,
              timestamp: new Date()
            };
            showExpandedBubble(post, 'cloud-canvas', null);
          } else if (firebaseInitialized && db && postsCollectionRef) {
            postsCollectionRef.doc(b.id).get().then(doc => {
              if (doc.exists) {
                showExpandedBubble({ id: doc.id, ...doc.data(), timestamp: doc.data().timestamp?.toDate() || new Date() }, 'cloud-canvas', null);
              }
            });
          }
          break;
        }
      }
    };

    canvas.ontouchend = () => {
      hoveredBubbleId = null;
    };

    if (!cloudPaused && bubbles.length) {
      console.log('JoyVibe: Starting cloud animation');
      requestAnimationFrame(animate);
    }
  } catch (err) {
    console.error('JoyVibe: Error in initCloud:', err);
  }
}

// Real-Time Subscription
function setupRealtime() {
  try {
    if (!firebaseInitialized || !postsCollectionRef) {
      console.warn('JoyVibe: Firebase not initialized, skipping realtime subscription');
      return;
    }
    console.log('JoyVibe: Setting up real-time subscription');
    postsCollectionRef.orderBy('timestamp', 'desc').limit(5).onSnapshot(snapshot => {
      console.log('JoyVibe: Real-time update for recent posts');
      loadRecentPosts();
    }, err => {
      console.error('JoyVibe: Real-time listener for recent posts failed:', err);
      showError('Real-time updates failed. Data may not be current.');
    });

    postsCollectionRef.onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'modified') {
          const post = {
            id: change.doc.id,
            message: change.doc.data().message,
            likes: change.doc.data().likes,
            dislikes: change.doc.data().dislikes,
            shares: change.doc.data().shares,
            userId: change.doc.data().userId,
            timestamp: change.doc.data().timestamp?.toDate() || new Date()
          };
          console.log('JoyVibe: Post updated:', post.id);
          updateBubble(post);
        }
      });
    }, err => {
      console.error('JoyVibe: Real-time listener for posts failed:', err);
    });
    console.log('JoyVibe: Realtime subscription set up');
  } catch (err) {
    console.error('JoyVibe: Error in setupRealtime:', err);
  }
}

// Function to toggle the zoom effect on the About section logo
function toggleLogoZoom(logo) {
  try {
    console.log('JoyVibe: Toggling logo zoom');
    logo.classList.toggle('zoomed');
  } catch (err) {
    console.error('JoyVibe: Error in toggleLogoZoom:', err);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('JoyVibe: Initializing at', new Date().toISOString());
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) errorMessage.style.display = 'none';

    // Always initialize the starry background
    initStars();

    // Update copyright year dynamically
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
      yearSpan.textContent = new Date().getFullYear();
    }

    // Check if we're on the main page (index.html) by looking for a section
    const isMainPage = document.querySelector('.section');
    if (isMainPage) {
      console.log('JoyVibe: Detected main page, running full initialization');
      await initializeFirebase();
      await loadRecentPosts();

      // Check URL hash and show the corresponding section
      const hash = window.location.hash.replace('#', '');
      if (hash && ['landing', 'feed', 'cloud', 'about'].includes(hash)) {
        showSection(hash);
      } else {
        showSection('landing'); // Default to landing if no valid hash
      }

      console.log('JoyVibe: Main page initialization complete');
    } else {
      console.log('JoyVibe: Detected secondary page, only starry background and copyright year initialized');
      await initializeFirebase(); // Still initialize Firebase to ensure auth for reactions
    }
  } catch (err) {
    console.error('JoyVibe: Initialization error:', err);
    showError('Site initialization failed. Using offline mode.');
    initStars();
    if (document.querySelector('.section')) {
      loadRecentPosts();
    }
  }
});
function copyTokenAddress() {
  try {
    const tokenAddress = document.getElementById('token-address-btn').textContent;
    navigator.clipboard.writeText(tokenAddress).then(() => {
      showError('Token address copied to clipboard!', 'success');
    }).catch(err => {
      showError('Failed to copy token address.');
      console.error('Clipboard error:', err);
    });
  } catch (err) {
    showError('An error occurred.');
    console.error('Copy token error:', err);
  }
}
function showError(message, type = 'error') {
  const errorMessage = document.getElementById('error-message');
  errorMessage.textContent = message;
  errorMessage.className = type; // Add 'success' or 'error' class
  errorMessage.style.display = 'block';
  setTimeout(() => errorMessage.style.display = 'none', 5000);
}

// Export functions to window for onclick handlers
window.toggleMenu = toggleMenu;
window.showSection = showSection;
window.quickPost = quickPost;
window.likePost = likePost;
window.dislikePost = dislikePost;
window.sharePost = sharePost;
window.toggleCloudPause = toggleCloudPause;
window.toggleLogoZoom = toggleLogoZoom;

