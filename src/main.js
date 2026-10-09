import { supabase } from './supabase.js';
import { validateNote, MAX_NOTE_LENGTH } from './validate.js';

// DOM Elements
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const userInfo = document.getElementById('user-info');
const userEmail = document.getElementById('user-email');

// Forms & Inputs
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authError = document.getElementById('auth-error');
const noteInput = document.getElementById('note-input');
const noteError = document.getElementById('note-error');
const noteCounter = document.getElementById('note-counter');
const notesList = document.getElementById('notes-list');

// Architecture Data (corrected after fact-check: Kong gateway, Supabase Auth naming,
// and Realtime/WAL wording)
const archData = {
  client: {
    title: 'Client',
    desc: 'SDKs (like supabase-js) or mobile apps communicating via HTTPS and WebSockets.',
  },
  kong: {
    title: 'Kong Gateway',
    desc: 'API gateway built on NGINX (Lua). Routes requests by URL path (e.g. /auth/v1, /rest/v1, /realtime/v1) to the matching service.',
  },
  auth: {
    title: 'Supabase Auth (formerly GoTrue)',
    desc: 'Manages users and issues JWTs. Built with Go and originally based on Netlify\'s GoTrue.',
  },
  rest: {
    title: 'PostgREST',
    desc: 'Introspects the database schema and turns tables into a RESTful API. Built with Haskell. Runs each request in a transaction with the caller\'s role so Row Level Security applies.',
  },
  realtime: {
    title: 'Realtime',
    desc: 'Elixir WebSocket server. Postgres Changes streams database changes from the WAL; Broadcast and Presence work through channels and do not use the WAL.',
  },
  storage: {
    title: 'Storage',
    desc: 'Manages files in S3-compatible object storage while tracking metadata and access rules in Postgres. Built with Node.js/TypeScript.',
  },
  postgres: {
    title: 'PostgreSQL DB',
    desc: 'The core database. Stores app data, the auth and storage schemas, and enforces Row Level Security policies. Built with C.',
  },
};

let currentUser = null;
let realtimeChannel = null;

// Initialization
async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  updateAuthState(session?.user);

  supabase.auth.onAuthStateChange((_event, session) => {
    updateAuthState(session?.user);
  });

  setupEventListeners();
}

// State Management
function updateAuthState(user) {
  // Skip if the signed-in user hasn't changed (avoids loading notes twice at startup
  // and on token refreshes)
  if ((user?.id ?? null) === (currentUser?.id ?? null)) return;

  currentUser = user || null;

  if (user) {
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    userInfo.classList.remove('hidden');
    userEmail.textContent = user.email;
    loadNotes();
    setupRealtime();
  } else {
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
    userInfo.classList.add('hidden');
    notesList.innerHTML = '';
    noteError.textContent = '';
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null; // FIX: reset so a new channel is created on next login
    }
  }
}

// Authentication Handlers
async function handleAuth(action) {
  const email = emailInput.value;
  const password = passwordInput.value;
  authError.textContent = '';

  const { error } = action === 'login'
    ? await supabase.auth.signInWithPassword({ email, password })
    : await supabase.auth.signUp({ email, password });

  if (error) authError.textContent = error.message;
}

// Notes CRUD
async function loadNotes() {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    noteError.textContent = `Could not load your notes: ${error.message}`;
    return;
  }
  renderNotes(data || []);
}

async function addNote(content) {
  // user_id is filled in by the table default (auth.uid()), so it is not sent here
  const { error } = await supabase
    .from('notes')
    .insert([{ content }]);

  if (error) {
    noteError.textContent = error.message;
  } else {
    noteInput.value = '';
    updateCounter();
  }
}

async function deleteNote(id) {
  const { error } = await supabase.from('notes').delete().eq('id', id);

  if (error) noteError.textContent = `Could not delete the note: ${error.message}`;
  else noteError.textContent = '';
}

// Realtime Setup
function setupRealtime() {
  if (realtimeChannel) return;

  realtimeChannel = supabase
    .channel('public:notes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => {
      // Refresh list to keep sorting clean
      loadNotes();
    })
    .subscribe();
}

// UI Rendering
function renderNotes(notes) {
  notesList.innerHTML = notes.map(note => `
    <li id="note-${note.id}">
      <div class="note-content">
        <div>${escapeHTML(note.content)}</div>
        <div class="note-date">${new Date(note.created_at).toLocaleString()}</div>
      </div>
      <button class="delete-btn" data-id="${note.id}">Delete</button>
    </li>
  `).join('');
}

// Utilities
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[tag]));
}

function updateCounter() {
  const length = noteInput.value.trim().length;
  noteCounter.textContent = `${length}/${MAX_NOTE_LENGTH}`;
  noteCounter.classList.toggle('over', length > MAX_NOTE_LENGTH);
}

// Event Listeners Configuration
function setupEventListeners() {
  // Auth
  document.getElementById('btn-login').addEventListener('click', (e) => {
    e.preventDefault();
    if (document.getElementById('auth-form').reportValidity()) handleAuth('login');
  });

  document.getElementById('btn-signup').addEventListener('click', (e) => {
    e.preventDefault();
    if (document.getElementById('auth-form').reportValidity()) handleAuth('signup');
  });

  document.getElementById('btn-logout').addEventListener('click', () => {
    supabase.auth.signOut();
  });

  // Character counter
  noteInput.addEventListener('input', updateCounter);

  // Notes submission
  document.getElementById('note-form').addEventListener('submit', (e) => {
    e.preventDefault();
    noteError.textContent = '';

    const validation = validateNote(noteInput.value);
    if (!validation.valid) {
      noteError.textContent = validation.error;
      return;
    }

    addNote(noteInput.value.trim());
  });

  // Delegated events for note deletion
  notesList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
      deleteNote(e.target.dataset.id);
    }
  });

  // Tabs
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      contents.forEach(c => c.classList.add('hidden'));

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      document.getElementById(tab.getAttribute('aria-controls')).classList.remove('hidden');
    });
  });

  // Architecture Diagram Interaction
  document.querySelectorAll('.arch-node').forEach(node => {
    node.addEventListener('click', (e) => {
      const comp = archData[e.currentTarget.dataset.node];
      document.getElementById('arch-title').textContent = comp.title;
      document.getElementById('arch-desc').textContent = comp.desc;
    });
  });
}

init();