<template>
  <header class="app-header">
    <div class="header-container">
      <!-- Logo and title -->
      <div class="header-brand">
        <div class="logo">
          <img v-if="logoUrl" :src="logoUrl" alt="Logo" class="logo-image" />
          <div v-else class="logo-placeholder">
            <RelicIcon />
          </div>
        </div>
        <div class="brand-text">
          <h1 class="app-title">{{ title }}</h1>
          <p v-if="subtitle" class="app-subtitle">{{ subtitle }}</p>
        </div>
      </div>
      
      <!-- Navigation menu -->
      <nav class="header-nav">
        <ul class="nav-list">
          <li 
            v-for="item in navigationItems" 
            :key="item.id"
            class="nav-item"
          >
            <button
              :class="['nav-link', { active: currentView === item.id }]"
              @click="$emit('navigate', item.id)"
            >
              <component v-if="item.icon" :is="item.icon" class="nav-icon" />
              {{ item.label }}
            </button>
          </li>
        </ul>
      </nav>
      
      <!-- Action buttons -->
      <div class="header-actions">
        <button 
          v-if="showResetButton"
          class="action-btn secondary"
          @click="$emit('reset')"
          title="Reset all selections"
        >
          <ResetIcon />
          <span class="btn-text">Reset</span>
        </button>
        
        <button 
          v-if="showSaveButton"
          class="action-btn primary"
          @click="$emit('save')"
          title="Save current build"
        >
          <SaveIcon />
          <span class="btn-text">Save</span>
        </button>
        
        <!-- Mobile menu toggle -->
        <button 
          class="mobile-menu-toggle"
          @click="toggleMobileMenu"
          aria-label="Toggle navigation menu"
        >
          <MenuIcon v-if="!mobileMenuOpen" />
          <CloseIcon v-else />
        </button>
      </div>
    </div>
    
    <!-- Mobile navigation overlay -->
    <div 
      v-if="mobileMenuOpen" 
      class="mobile-nav-overlay"
      @click="toggleMobileMenu"
    >
      <nav class="mobile-nav" @click.stop>
        <ul class="mobile-nav-list">
          <li 
            v-for="item in navigationItems" 
            :key="item.id"
            class="mobile-nav-item"
          >
            <button
              :class="['mobile-nav-link', { active: currentView === item.id }]"
              @click="handleMobileNavigation(item.id)"
            >
              <component v-if="item.icon" :is="item.icon" class="nav-icon" />
              {{ item.label }}
            </button>
          </li>
        </ul>
        
        <div class="mobile-actions">
          <button 
            v-if="showResetButton"
            class="mobile-action-btn secondary"
            @click="handleMobileAction('reset')"
          >
            <ResetIcon />
            Reset
          </button>
          
          <button 
            v-if="showSaveButton"
            class="mobile-action-btn primary"
            @click="handleMobileAction('save')"
          >
            <SaveIcon />
            Save
          </button>
        </div>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Props
interface NavigationItem {
  id: string
  label: string
  icon?: any
}

interface Props {
  title?: string
  subtitle?: string
  logoUrl?: string
  currentView?: string
  navigationItems?: NavigationItem[]
  showResetButton?: boolean
  showSaveButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Nightreign Relic Calculator',
  subtitle: 'Optimize your relic combinations',
  navigationItems: () => [
    { id: 'calculator', label: 'Calculator', icon: 'CalculatorIcon' },
    { id: 'builds', label: 'Builds', icon: 'BuildsIcon' },
    { id: 'history', label: 'History', icon: 'HistoryIcon' },
    { id: 'analytics', label: 'Analytics', icon: 'AnalyticsIcon' }
  ],
  showResetButton: true,
  showSaveButton: true
})

// Emits
defineEmits<{
  navigate: [viewId: string]
  reset: []
  save: []
}>()

// State
const mobileMenuOpen = ref(false)

// Methods
const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const handleMobileNavigation = (viewId: string) => {
  mobileMenuOpen.value = false
  props.$emit?.('navigate', viewId)
}

const handleMobileAction = (action: string) => {
  mobileMenuOpen.value = false
  if (action === 'reset') {
    props.$emit?.('reset')
  } else if (action === 'save') {
    props.$emit?.('save')
  }
}

// Icon components (simplified)
const RelicIcon = {
  template: `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9l-5 4.87L18.18 22 12 18.77 5.82 22 7 13.87 2 9l6.91-.74L12 2z"/>
    </svg>
  `
}

const MenuIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
    </svg>
  `
}

const CloseIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
    </svg>
  `
}

const SaveIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h2.5a.5.5 0 0 1 0 1H2z"/>
    </svg>
  `
}

const ResetIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path fill-rule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/>
      <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/>
    </svg>
  `
}
</script>

<style scoped>
.app-header {
  background: white;
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.logo {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.logo-placeholder {
  width: 100%;
  height: 100%;
  background: var(--primary-color);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.brand-text {
  min-width: 0;
}

.app-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.2;
}

.app-subtitle {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.3;
}

.header-nav {
  flex: 1;
  display: flex;
  justify-content: center;
}

.nav-list {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 0.5rem;
}

.nav-item {
  margin: 0;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.nav-link:hover {
  background: var(--gray-50);
  color: var(--text-primary);
  transform: none;
  box-shadow: none;
}

.nav-link.active {
  background: var(--primary-color);
  color: white;
}

.nav-icon {
  width: 16px;
  height: 16px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.action-btn.primary {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.action-btn.primary:hover {
  background: #2980b9;
  border-color: #2980b9;
  transform: translateY(-1px);
}

.action-btn.secondary {
  background: white;
  color: var(--text-secondary);
}

.action-btn.secondary:hover {
  background: var(--gray-50);
  color: var(--text-primary);
  transform: translateY(-1px);
}

.mobile-menu-toggle {
  display: none;
  background: none;
  border: none;
  padding: 0.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--border-radius);
  transition: all 0.2s;
}

.mobile-menu-toggle:hover {
  background: var(--gray-50);
  color: var(--text-primary);
  transform: none;
  box-shadow: none;
}

.mobile-nav-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.mobile-nav {
  position: absolute;
  top: 4rem;
  right: 1rem;
  background: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-md);
  padding: 1rem;
  min-width: 200px;
  animation: slideDown 0.2s ease-out;
}

.mobile-nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.mobile-nav-item {
  margin: 0;
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem;
  border: none;
  background: none;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  text-align: left;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
}

.mobile-nav-link:hover {
  background: var(--gray-50);
  color: var(--text-primary);
  transform: none;
  box-shadow: none;
}

.mobile-nav-link.active {
  background: var(--primary-color);
  color: white;
}

.mobile-actions {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mobile-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.mobile-action-btn.primary {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.mobile-action-btn.secondary {
  background: white;
  color: var(--text-secondary);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-0.5rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile responsive design */
@media (max-width: 768px) {
  .header-container {
    padding: 1rem;
    gap: 1rem;
  }
  
  .app-title {
    font-size: 1.25rem;
  }
  
  .app-subtitle {
    font-size: 0.8rem;
  }
  
  .header-nav {
    display: none;
  }
  
  .action-btn .btn-text {
    display: none;
  }
  
  .action-btn {
    padding: 0.5rem;
    width: 40px;
    height: 40px;
    justify-content: center;
  }
  
  .mobile-menu-toggle {
    display: flex;
  }
}

@media (max-width: 480px) {
  .header-container {
    padding: 0.75rem;
  }
  
  .brand-text {
    display: none;
  }
  
  .logo {
    width: 32px;
    height: 32px;
  }
}
</style>