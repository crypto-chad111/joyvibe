const supabase = Supabase.createClient('https://cfyptrsiifzrnncpagxd.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmeXB0cnNpaWZ6cm5uY3BhZ3hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NDc4ODQsImV4cCI6MjA2MzUyMzg4NH0.bZHWgOp6afE1eE4eKz9V6rCtMRbPwMnyoMa_KP3PJUI');

// State
let cloudPaused = false;
let cloudZoom = 1;
let bubbles = [];
let ctx, canvas;
let hoveredBubbleId = null;
let expandedBubbleId = null;
let originalBubble = null;
let originalContainerId = null;

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

// Check Posting Limit (30 minutes)
function canPost() {
  try {
    console.log('JoyVibe: Checking post limit');
    const lastPostTime = localStorage.getItem('lastPostTime');
    if (!lastPostTime) {
      console.log('JoyVibe: No last post time, can post');
      return true;
    }
    const now = Date.now();
    const diff = now - parseInt(lastPostTime);
    const minutes30 = 30 * 60 * 1000;
    console.log('JoyVibe: Time since last post:', diff / 1000, 'seconds');
    return diff >= minutes30;
  } catch (err) {
    console.error('JoyVibe: localStorage error:', err);
    return true;
  }
}

// Update Post Time
function updatePostTime() {
  try {
    console.log('JoyVibe: Updating post time');
    localStorage.setItem('lastPostTime', Date.now().toString());
  } catch (err) {
    console.error('JoyVibe: localStorage error:', err);
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
    if (sectionId === 'feed') loadFeed('newest');
    if (sectionId === 'cloud') initCloud();
    if (sectionId === 'landing') loadRecentPosts();
    closeAllExpandedBubbles();
  } catch (err) {
    console.error('JoyVibe: Error in showSection:', err);
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
    const isLiked = post.userAction === 'liked';
    const isDisliked = post.userAction === 'disliked';
    let text;
    if (!isCloud) {
      const isExpanded = expandedBubbleId === post.id;
      bubble.classList.toggle('expanded', isExpanded);
      if (isExpanded) {
        text = sanitizeText(post.text);
        const textLength = post.text.length;
        const size = Math.min(800, 300 + (textLength / 614) * 500);
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.dataset.baseSize = size;
        console.log('JoyVibe: Expanded bubble size:', size);
      } else {
        const words = post.text.split(' ').slice(0, 5).join(' ');
        text = words.length > 30 ? words.slice(0, 27) + '...' : words + (post.text.length > words.length ? '...' : '');
        text = sanitizeText(text);
      }
      bubble.innerHTML = `
        <div class="bubble-content">
          <p>${text}</p>
          <div class="actions">
            <span class="${isLiked ? 'disabled' : ''}" onclick="event.stopPropagation(); ${isLiked ? '' : `likePost(${post.id})`}">❤️ ${post.likes || 0}</span>
            <span class="${isDisliked ? 'disabled' : ''}" onclick="event.stopPropagation(); ${isDisliked ? '' : `dislikePost(${post.id})`}">⬇ ${post.dislikes || 0}</span>
            <span onclick="event.stopPropagation(); sharePost(${post.id})">📤 Share</span>
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

// Load Recent Posts
async function loadRecentPosts() {
  try {
    console.log('JoyVibe: Loading recent posts');
    const container = document.getElementById('recent-posts');
    if (!container) {
      console.error('JoyVibe: recent-posts container missing');
      return;
    }
    container.innerHTML = '';
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(5);
    if (error) {
      console.error('JoyVibe: Supabase error fetching recent posts:', error);
      return;
    }
    if (posts && posts.length) {
      posts.forEach(post => {
        const bubble = createBubble(post);
        container.appendChild(bubble);
      });
      observeBubbles();
    } else {
      container.innerHTML = '<p>No recent posts available.</p>';
    }
  } catch (err) {
    console.error('JoyVibe: Error in loadRecentPosts:', err);
  }
}

// Load Feed
async function loadFeed(sort) {
  try {
    console.log('JoyVibe: Loading feed:', sort);
    const container = document.getElementById('feed-posts');
    if (!container) {
      console.error('JoyVibe: feed-posts container missing');
      return;
    }
    container.innerHTML = '';
    let query = supabase.from('posts').select('*');
    query = sort === 'liked' ? query.order('likes', { ascending: false }) : query.order('timestamp', { ascending: false });
    const { data: posts, error } = await query;
    if (error) {
      console.error('JoyVibe: Supabase error fetching feed:', error);
      return;
    }
    if (posts && posts.length) {
      posts.forEach(post => {
        const bubble = createBubble(post);
        container.appendChild(bubble);
      });
      observeBubbles();
    } else {
      container.innerHTML = '<p>No posts available.</p>';
    }
  } catch (err) {
    console.error('JoyVibe: Error in loadFeed:', err);
  }
}

// Observe Bubbles
function observeBubbles() {
  try {
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
      return;
    }
    const text = textArea.value.trim();
    if (!text) {
      alert('Please enter a post.');
      return;
    }
    if (!canPost()) {
      alert('You can only post once every 30 minutes.');
      return;
    }
    await submitPost(text);
    textArea.value = '';
  } catch (err) {
    console.error('JoyVibe: Error in quickPost:', err);
    alert('Failed to post. Check console for details.');
  }
}

// Submit Post
async function submitPost(text) {
  try {
    console.log('JoyVibe: Submitting post:', text);
    const post = {
      id: Date.now(),
      text: sanitizeText(text),
      likes: 0,
      dislikes: 0,
      timestamp: new Date().toISOString()
    };
    const { error } = await supabase
      .from('posts')
      .insert([post]);
    if (error) {
      console.error('JoyVibe: Supabase error inserting post:', error);
      throw error;
    }
    updatePostTime();
    console.log('JoyVibe: Post submitted:', post.id);
  } catch (err) {
    console.error('JoyVibe: Error in submitPost:', err);
    throw err;
  }
}

// Like/Dislike/Share
async function likePost(id) {
  try {
    const userId = localStorage.getItem('userId') || Date.now().toString();
    localStorage.setItem('userId', userId);
    const { data: existing } = await supabase
      .from('user_actions')
      .select('action')
      .eq('user_id', userId)
      .eq('post_id', id)
      .single();
    if (existing) {
      return;
    }
    const { error: insertError } = await supabase
      .from('user_actions')
      .insert([{ user_id: userId, post_id: id, action: 'liked' }]);
    if (insertError) {
      console.error('JoyVibe: Failed to record like:', insertError);
      return;
    }
    const { error: updateError } = await supabase
      .from('posts')
      .update({ likes: supabase.raw('likes + 1') })
      .eq('id', id);
    if (updateError) {
      console.error('JoyVibe: Failed to update likes:', updateError);
    }
  } catch (err) {
    console.error('JoyVibe: Error in likePost:', err);
  }
}

async function dislikePost(id) {
  try {
    const userId = localStorage.getItem('userId') || Date.now().toString();
    localStorage.setItem('userId', userId);
    const { data: existing } = await supabase
      .from('user_actions')
      .select('action')
      .eq('user_id', userId)
      .eq('post_id', id)
      .single();
    if (existing) {
      return;
    }
    const { error: insertError } = await supabase
      .from('user_actions')
      .insert([{ user_id: userId, post_id: id, action: 'disliked' }]);
    if (insertError) {
      console.error('JoyVibe: Failed to record dislike:', insertError);
      return;
    }
    const { error: updateError } = await supabase
      .from('posts')
      .update({ dislikes: supabase.raw('dislikes + 1') })
      .eq('id', id);
    if (updateError) {
      console.error('JoyVibe: Failed to update dislikes:', updateError);
    }
  } catch (err) {
    console.error('JoyVibe: Error in dislikePost:', err);
  }
}

function sharePost(id) {
  try {
    const url = `https://joyvibe.world/?post=${id}`;
    navigator.clipboard.writeText(url).then(() => {
      console.log('JoyVibe: URL copied');
    }).catch(err => {
      console.error('JoyVibe: Clipboard error:', err);
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

    const userId = localStorage.getItem('userId') || Date.now().toString();
    const { data: userAction } = await supabase
      .from('user_actions')
      .select('action')
      .eq('user_id', userId)
      .eq('post_id', post.id)
      .single();
    post.userAction = userAction ? userAction.action : null;

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

    if (containerId === 'cloud-canvas') {
      cloudPaused = true;
      document.getElementById('cloud').appendChild(bubble);
    } else {
      document.body.appendChild(bubble);
    }
  } catch (err) {
    console.error('JoyVibe: Error in showExpandedBubble:', err);
  }
}

function closeAllExpandedBubbles() {
  try {
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

// Starry Background
function initStars() {
  try {
    console.log('JoyVibe: Initializing starry background');
    const starsCanvas = document.getElementById('stars-canvas');
    if (!starsCanvas) {
      console.error('JoyVibe: stars-canvas missing');
      return;
    }
    const starsCtx = starsCanvas.getContext('2d');
    if (!starsCtx) {
      console.error('JoyVibe: Failed to get stars canvas context');
      return;
    }
    starsCanvas.width = window.innerWidth;
    starsCanvas.height = window.innerHeight;

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
    }

    window.addEventListener('resize', () => {
      starsCanvas.width = window.innerWidth;
      starsCanvas.height = window.innerHeight;
      stars.forEach(star => {
        star.x = Math.random() * starsCanvas.width;
        star.y = Math.random() * starsCanvas.height;
      });
    });

    animateStars();
  } catch (err) {
    console.error('JoyVibe: Error in initStars:', err);
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
      b.x += b.vx * cloudZoom;
      b.y += b.vy * cloudZoom;
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

// Dream-Cloud Initialization
async function initCloud() {
  try {
    console.log('JoyVibe: Initializing Dream-Cloud');
    canvas = document.getElementById('cloud-canvas');
    if (!canvas) {
      console.error('JoyVibe: cloud-canvas missing');
      return;
    }
    ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('JoyVibe: Failed to get canvas context');
      return;
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .order('likes', { ascending: false })
      .limit(20);
    if (error) {
      console.error('JoyVibe: Supabase error fetching cloud posts:', error);
      return;
    }
    bubbles = posts && posts.length ? posts.map(post => ({
      id: post.id,
      text: post.text.split(' ')[0],
      likes: post.likes || 0,
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 1,
      vy: (Math.random() - 0.5) * 1,
      radius: 40
    })) : [];
    console.log('JoyVibe: Cloud bubbles created:', bubbles.length);

    canvas.onclick = e => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      for (let b of bubbles) {
        const dist = Math.sqrt((mouseX - b.x) ** 2 + (mouseY - b.y) ** 2);
        if (dist <= b.radius) {
          supabase
            .from('posts')
            .select('*')
            .eq('id', b.id)
            .single()
            .then(({ data: post, error }) => {
              if (error) {
                console.error('JoyVibe: Error fetching post:', error);
                return;
              }
              if (post) {
                showExpandedBubble(post, 'cloud-canvas', null);
              }
            });
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
      hoveredBubbleId = null;
      bubbles.forEach(b => {
        const dist = Math.sqrt((touchX - b.x) ** 2 + (touchY - b.y) ** 2);
        if (dist <= b.radius) {
          hoveredBubbleId = b.id;
          supabase
            .from('posts')
            .select('*')
            .eq('id', b.id)
            .single()
            .then(({ data: post, error }) => {
              if (error) {
                console.error('JoyVibe: Error fetching post:', error);
                return;
              }
              if (post) {
                showExpandedBubble(post, 'cloud-canvas', null);
              }
            });
        }
      });
    };

    canvas.ontouchend = () => {
      hoveredBubbleId = null;
    };

    if (!cloudPaused && bubbles.length) requestAnimationFrame(animate);
  } catch (err) {
    console.error('JoyVibe: Error in initCloud:', err);
  }
}

// Cloud Controls
function toggleCloudPause() {
  try {
    cloudPaused = !cloudPaused;
    if (!cloudPaused && canvas && ctx) requestAnimationFrame(animate);
  } catch (err) {
    console.error('JoyVibe: Error in toggleCloudPause:', err);
  }
}

function zoomCloud(factor) {
  try {
    cloudZoom *= factor;
  } catch (err) {
    console.error('JoyVibe: Error in zoomCloud:', err);
  }
}

// Real-Time Subscription
supabase
  .channel('posts')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, payload => {
    console.log('JoyVibe: New post received:', payload.new.id);
    loadRecentPosts();
    loadFeed('newest');
  })
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, async payload => {
    console.log('JoyVibe: Post updated:', payload.new.id);
    const userId = localStorage.getItem('userId') || Date.now().toString();
    const { data: userAction } = await supabase
      .from('user_actions')
      .select('action')
      .eq('user_id', userId)
      .eq('post_id', payload.new.id)
      .single();
    payload.new.userAction = userAction ? userAction.action : null;
    updateBubble(payload.new);
  })
  .subscribe();

// Update Bubble
async function updateBubble(post) {
  try {
    const bubbles = document.querySelectorAll(`.bubble[data-post-id="${post.id}"]`);
    bubbles.forEach(bubble => {
      const isExpanded = bubble.classList.contains('expanded');
      const isLiked = post.userAction === 'liked';
      const isDisliked = post.userAction === 'disliked';
      const text = isExpanded ? sanitizeText(post.text) : sanitizeText(post.text.split(' ').slice(0, 5).join(' ')) + (post.text.length > 30 ? '...' : '');
      bubble.querySelector('.bubble-content').innerHTML = `
        <p>${text}</p>
        <div class="actions">
          <span class="${isLiked ? 'disabled' : ''}" onclick="event.stopPropagation(); ${isLiked ? '' : `likePost(${post.id})`}">❤️ ${post.likes || 0}</span>
          <span class="${isDisliked ? 'disabled' : ''}" onclick="event.stopPropagation(); ${isDisliked ? '' : `dislikePost(${post.id})`}">⬇ ${post.dislikes || 0}</span>
          <span onclick="event.stopPropagation(); sharePost(${post.id})">📤 Share</span>
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
    closeAllExpandedBubbles();
  }
});

// Initialize
try {
  console.log('JoyVibe: Initializing');
  const errorMessage = document.getElementById('error-message');
  if (errorMessage) errorMessage.style.display = 'none';
  initStars();
  loadRecentPosts();
  showSection('landing');
} catch (err) {
  console.error('JoyVibe: Initialization error:', err);
  const errorMessage = document.getElementById('error-message');
  if (errorMessage) errorMessage.style.display = 'block';
}
