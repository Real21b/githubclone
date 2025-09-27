# 🐙 GitHub Repository Kurulum Rehberi

## 📋 **GitHub Repository Oluşturma Adımları**

### **1. GitHub'da Yeni Repository Oluşturma**

#### **Web Arayüzü ile:**
1. **GitHub.com**'a gidin ve giriş yapın
2. **"New repository"** butonuna tıklayın
3. **Repository bilgilerini doldurun:**
   - **Repository name**: `githubclone`
   - **Description**: `Modern microservices platform with 12 services, real-time features, AI integration, and comprehensive monitoring`
   - **Visibility**: `Public` (veya `Private`)
   - **Initialize**: ❌ **"Add a README file"** işaretini kaldırın
   - **Initialize**: ❌ **"Add .gitignore"** işaretini kaldırın
   - **Initialize**: ❌ **"Choose a license"** işaretini kaldırın
4. **"Create repository"** butonuna tıklayın

#### **GitHub CLI ile:**
```bash
# GitHub CLI kurulumu (eğer yoksa)
# Windows: winget install GitHub.cli
# macOS: brew install gh
# Linux: curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg

# GitHub'a giriş yapın
gh auth login

# Repository oluşturun
gh repo create githubclone --public --description "Modern microservices platform with 12 services, real-time features, AI integration, and comprehensive monitoring"
```

### **2. Local Repository'yi GitHub'a Bağlama**

#### **Remote Repository Ekleme:**
```bash
# GitHub repository URL'ini ekleyin (kendi kullanıcı adınızla değiştirin)
git remote add origin https://github.com/YOUR_USERNAME/githubclone.git

# Remote repository'yi kontrol edin
git remote -v
```

#### **Branch İsimlendirme:**
```bash
# Ana branch'i main olarak değiştirin
git branch -M main

# Veya mevcut branch'i main olarak yeniden adlandırın
git branch -m master main
```

### **3. İlk Push İşlemi**

#### **Tüm Dosyaları GitHub'a Yükleme:**
```bash
# İlk push işlemi
git push -u origin main

# Sonraki push'lar için
git push origin main
```

### **4. GitHub Repository Ayarları**

#### **Repository Settings:**
1. **Settings** sekmesine gidin
2. **General** bölümünde:
   - **Repository name**: `githubclone`
   - **Description**: Güncelleyin
   - **Website**: `https://github.com/YOUR_USERNAME/githubclone`
   - **Topics**: `microservices`, `nodejs`, `typescript`, `docker`, `kubernetes`, `monitoring`, `performance`, `ai`, `real-time`

#### **Branch Protection Rules:**
1. **Settings** > **Branches** > **Add rule**
2. **Branch name pattern**: `main`
3. **Protect matching branches**:
   - ✅ **Require a pull request before merging**
   - ✅ **Require status checks to pass before merging**
   - ✅ **Require branches to be up to date before merging**
   - ✅ **Restrict pushes that create files**

#### **Secrets ve Variables:**
1. **Settings** > **Secrets and variables** > **Actions**
2. **New repository secret** ekleyin:
   - `SONAR_TOKEN`: SonarQube token'ı
   - `DOCKER_USERNAME`: Docker Hub kullanıcı adı
   - `DOCKER_PASSWORD`: Docker Hub şifresi
   - `DATABASE_URL`: Production database URL'i
   - `JWT_SECRET`: JWT secret key

### **5. GitHub Actions Workflow Ayarları**

#### **Workflow Dosyası Kontrolü:**
```bash
# Workflow dosyasının doğru olduğunu kontrol edin
cat .github/workflows/main.yml
```

#### **Workflow Tetikleme:**
```bash
# Workflow'u test etmek için bir değişiklik yapın
echo "# Test commit" >> README.md
git add README.md
git commit -m "test: trigger GitHub Actions workflow"
git push origin main
```

### **6. Repository Organizasyonu**

#### **Issues ve Projects:**
1. **Issues** sekmesinde template'ler oluşturun
2. **Projects** sekmesinde proje yönetimi kurun
3. **Milestones** oluşturun

#### **Wiki ve Pages:**
1. **Wiki** sekmesinde dokümantasyon oluşturun
2. **Settings** > **Pages** ile GitHub Pages aktifleştirin

### **7. Collaborators ve Teams**

#### **Collaborators Ekleme:**
1. **Settings** > **Manage access** > **Invite a collaborator**
2. Kullanıcı adı veya e-posta ile davet gönderin

#### **Teams Oluşturma:**
1. **Settings** > **Manage access** > **Create team**
2. Team'lere repository erişimi verin

## 🔧 **Git Konfigürasyonu**

### **Global Git Ayarları:**
```bash
# Kullanıcı bilgilerini ayarlayın
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Default branch'i main olarak ayarlayın
git config --global init.defaultBranch main

# Line ending ayarları (Windows için)
git config --global core.autocrlf true

# Credential helper (Windows için)
git config --global credential.helper manager-core
```

### **Repository Specific Ayarları:**
```bash
# Bu repository için özel ayarlar
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

## 🚀 **GitHub Actions CI/CD**

### **Workflow Durumu Kontrolü:**
```bash
# GitHub Actions durumunu kontrol edin
gh run list

# Son workflow'u görüntüleyin
gh run view

# Workflow loglarını görüntüleyin
gh run view --log
```

### **Manual Workflow Trigger:**
```bash
# Workflow'u manuel olarak tetikleyin
gh workflow run main.yml
```

## 📊 **Repository Analytics**

### **Insights Sekmesi:**
- **Traffic**: Repository trafiği
- **Contributors**: Katkıda bulunanlar
- **Commits**: Commit geçmişi
- **Code frequency**: Kod değişim sıklığı
- **Dependency graph**: Bağımlılık grafiği

### **Security Sekmesi:**
- **Dependabot alerts**: Güvenlik uyarıları
- **Code scanning**: Kod tarama sonuçları
- **Secret scanning**: Gizli bilgi tarama

## 🔐 **Güvenlik Ayarları**

### **Two-Factor Authentication:**
1. **Settings** > **Password and authentication**
2. **Two-factor authentication** aktifleştirin

### **SSH Keys:**
```bash
# SSH key oluşturun
ssh-keygen -t ed25519 -C "your.email@example.com"

# SSH key'i GitHub'a ekleyin
cat ~/.ssh/id_ed25519.pub
# Bu çıktıyı GitHub > Settings > SSH and GPG keys > New SSH key
```

### **Personal Access Tokens:**
1. **Settings** > **Developer settings** > **Personal access tokens**
2. **Generate new token** ile token oluşturun
3. Gerekli scope'ları seçin:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
   - `write:packages` (Upload packages to GitHub Package Registry)

## 📚 **Dokümantasyon**

### **README.md Güncelleme:**
```bash
# README.md'yi güncelleyin
# GitHub repository URL'ini güncelleyin
# Badge'leri güncelleyin
# Installation talimatlarını güncelleyin
```

### **CONTRIBUTING.md Oluşturma:**
```bash
# Katkıda bulunma rehberi oluşturun
touch CONTRIBUTING.md
```

### **CHANGELOG.md Oluşturma:**
```bash
# Değişiklik geçmişi oluşturun
touch CHANGELOG.md
```

## 🎯 **Repository Best Practices**

### **Commit Mesajları:**
```bash
# Conventional Commits kullanın
feat: add new feature
fix: fix bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

### **Branch Stratejisi:**
```bash
# Feature branches
git checkout -b feature/new-feature
git checkout -b bugfix/fix-bug
git checkout -b hotfix/critical-fix

# Release branches
git checkout -b release/v1.0.0
```

### **Pull Request Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
```

## 🎉 **Repository Hazır!**

### **Son Kontroller:**
- ✅ Repository oluşturuldu
- ✅ Local repository bağlandı
- ✅ İlk commit yapıldı
- ✅ GitHub Actions aktif
- ✅ Branch protection kuruldu
- ✅ Secrets yapılandırıldı
- ✅ Dokümantasyon güncel

### **Sonraki Adımlar:**
1. **Collaborators** ekleyin
2. **Issues** ve **Projects** oluşturun
3. **Wiki** dokümantasyonu ekleyin
4. **GitHub Pages** aktifleştirin
5. **Dependabot** yapılandırın

---

**🚀 GitHub repository'niz hazır! Artık takım çalışmasına başlayabilirsiniz!**
