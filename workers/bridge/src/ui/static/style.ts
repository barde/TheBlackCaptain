/**
 * CSS Styles for Captain's Bridge
 * Maritime-themed styling matching The Black Captain blog
 */

export default `
:root {
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --bg-tertiary: #1a1a25;
  --text-primary: #e8e6e3;
  --text-secondary: #a0a0a0;
  --brass: #d4af37;
  --brass-dim: #8b7355;
  --red: #8b0000;
  --green: #2e7d32;
  --blue: #1565c0;
  --border: #2a2a35;
  --shadow: rgba(0, 0, 0, 0.5);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Crimson Text', Georgia, serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  min-height: 100vh;
}

/* Login Page */
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
}

.login-container {
  width: 100%;
  max-width: 400px;
  padding: 1rem;
}

.login-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 4px 20px var(--shadow);
}

.login-card h1 {
  font-size: 1.8rem;
  color: var(--brass);
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.help-text {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 1.5rem;
}

/* Forms */
.form-group {
  margin-bottom: 1rem;
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

input[type="text"],
input[type="email"],
input[type="datetime-local"],
textarea,
select {
  width: 100%;
  padding: 0.75rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 1rem;
}

input[type="datetime-local"]::-webkit-calendar-picker-indicator {
  filter: invert(0.8);
  cursor: pointer;
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: var(--brass);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-family: inherit;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--brass);
  color: var(--bg-primary);
}

.btn-primary:hover:not(:disabled) {
  background: #e5c04a;
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--border);
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
}

.btn-ghost:hover:not(:disabled) {
  color: var(--text-primary);
}

.btn-block {
  width: 100%;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

.btn-ai {
  background: linear-gradient(135deg, #1a1a25 0%, #2a2a40 100%);
  color: var(--brass);
  border: 1px solid var(--brass-dim);
}

.btn-ai:hover:not(:disabled) {
  border-color: var(--brass);
}

/* Status Messages */
.status {
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  display: none;
}

.status.error {
  display: block;
  background: rgba(139, 0, 0, 0.2);
  border: 1px solid var(--red);
  color: #ff6b6b;
}

.status.success {
  display: block;
  background: rgba(46, 125, 50, 0.2);
  border: 1px solid var(--green);
  color: #81c784;
}

.status.info {
  display: block;
  background: rgba(21, 101, 192, 0.2);
  border: 1px solid var(--blue);
  color: #64b5f6;
}

/* Editor Layout */
.editor-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
}

.header-left h1 {
  font-size: 1.2rem;
  color: var(--brass);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-name {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.editor-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  width: 280px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  overflow-y: auto;
  padding: 1rem;
}

.sidebar-section h3 {
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
}

.article-filters {
  margin-bottom: 1rem;
}

.article-filters select {
  width: 100%;
  padding: 0.5rem;
  font-size: 0.85rem;
}

.article-list {
  list-style: none;
  margin-top: 1rem;
}

.article-list li {
  padding: 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 0.25rem;
  transition: background 0.2s;
}

.article-list li:hover {
  background: var(--bg-tertiary);
}

.article-list li.active {
  background: var(--bg-tertiary);
  border-left: 2px solid var(--brass);
}

.article-list .article-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.article-list .article-meta {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.article-list .article-type {
  background: var(--bg-primary);
  padding: 0.125rem 0.5rem;
  border-radius: 2px;
  margin-right: 0.5rem;
}

.article-list .article-status {
  padding: 0.125rem 0.5rem;
  border-radius: 2px;
}

.article-list .status-draft {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.article-list .status-published {
  background: rgba(46, 125, 50, 0.2);
  color: #81c784;
}

.article-list .status-scheduled {
  background: rgba(21, 101, 192, 0.2);
  color: #64b5f6;
}

.article-list .scheduled-date {
  display: block;
  font-size: 0.7rem;
  color: #64b5f6;
  margin-top: 0.25rem;
}

/* Main Editor */
.editor-main {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.no-article {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
}

.article-editor {
  max-width: 900px;
  margin: 0 auto;
}

.editor-toolbar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--brass);
  border-bottom-color: var(--brass);
}

.editor-meta {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.meta-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

#article-content {
  width: 100%;
  min-height: 400px;
  padding: 1rem;
  font-family: 'Courier New', monospace;
  font-size: 0.95rem;
  line-height: 1.8;
  resize: vertical;
}

.ai-toolbar {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

/* Preview */
.preview-content {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 2rem;
  min-height: 400px;
}

.preview-content h1,
.preview-content h2,
.preview-content h3 {
  color: var(--brass);
  margin: 1.5rem 0 1rem;
}

.preview-content h1:first-child,
.preview-content h2:first-child {
  margin-top: 0;
}

.preview-content p {
  margin-bottom: 1rem;
}

.preview-content a {
  color: var(--brass);
}

.preview-content blockquote {
  border-left: 3px solid var(--brass-dim);
  padding-left: 1rem;
  margin: 1rem 0;
  color: var(--text-secondary);
  font-style: italic;
}

.preview-content code {
  background: var(--bg-tertiary);
  padding: 0.125rem 0.375rem;
  border-radius: 2px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.preview-content pre {
  background: var(--bg-tertiary);
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  margin: 1rem 0;
}

.preview-content pre code {
  background: none;
  padding: 0;
}

/* AI Output */
.ai-output {
  margin-top: 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--brass-dim);
  border-radius: 8px;
  overflow: hidden;
}

.ai-output-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #1a1a25 0%, #2a2a40 100%);
  border-bottom: 1px solid var(--border);
}

.ai-output-header span {
  color: var(--brass);
  font-weight: 500;
}

.ai-output-actions {
  display: flex;
  gap: 0.5rem;
}

.ai-content {
  padding: 1rem;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 8px 32px var(--shadow);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  color: var(--brass);
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
}

.modal-close:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: 1rem;
}

.modal-body textarea {
  min-height: 100px;
  resize: vertical;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 4px 20px var(--shadow);
  transform: translateY(100px);
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 1001;
}

.toast.show {
  transform: translateY(0);
  opacity: 1;
}

.toast.success {
  border-color: var(--green);
}

.toast.error {
  border-color: var(--red);
}

/* Responsive */
@media (max-width: 768px) {
  .editor-layout {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    max-height: 200px;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }

  .meta-row {
    grid-template-columns: 1fr;
  }

  .header-right {
    gap: 0.5rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }
}
`;
