#!/usr/bin/env node

/**
 * Architecture Validation Script
 * Validates all services and their configurations
 */

const fs = require('fs');
const path = require('path');

class ArchitectureValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.services = [
      'auth-service',
      'core-service', 
      'file-service',
      'email-service',
      'sms-service',
      'notification-service',
      'wordpress-service',
      'whatsapp-service',
      'telegram-service',
      'ai-service'
    ];
  }

  validate() {
    console.log('🔍 Validating Microservices Architecture...\n');

    this.validateServices();
    this.validateDockerCompose();
    this.validatePackageJson();
    this.validateTypeScript();
    this.validateDockerfiles();

    this.printResults();
  }

  validateServices() {
    console.log('📁 Validating Service Structure...');
    
    this.services.forEach(service => {
      const servicePath = path.join(__dirname, '..', 'services', service);
      
      if (!fs.existsSync(servicePath)) {
        this.errors.push(`❌ Service directory missing: ${service}`);
        return;
      }

      // Check required files
      const requiredFiles = [
        'package.json',
        'tsconfig.json',
        'Dockerfile',
        'src/main.ts'
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(servicePath, file);
        if (!fs.existsSync(filePath)) {
          this.errors.push(`❌ Missing file: ${service}/${file}`);
        }
      });

      // Check source structure
      const srcPath = path.join(servicePath, 'src');
      if (fs.existsSync(srcPath)) {
        const srcFiles = fs.readdirSync(srcPath);
        
        if (!srcFiles.includes('main.ts')) {
          this.errors.push(`❌ Missing main.ts in ${service}`);
        }

        if (!srcFiles.includes('utils') || !fs.existsSync(path.join(srcPath, 'utils', 'logger.ts'))) {
          this.warnings.push(`⚠️  Missing logger utility in ${service}`);
        }

        if (!srcFiles.includes('middleware') || !fs.existsSync(path.join(srcPath, 'middleware', 'errorHandler.ts'))) {
          this.warnings.push(`⚠️  Missing error handler middleware in ${service}`);
        }
      }

      console.log(`✅ ${service} structure validated`);
    });
  }

  validateDockerCompose() {
    console.log('\n🐳 Validating Docker Compose...');
    
    const composeFiles = [
      'docker-compose.yml',
      'docker-compose.kafka.yml',
      'docker-compose.microservices.yml'
    ];

    composeFiles.forEach(file => {
      const filePath = path.join(__dirname, '..', file);
      if (!fs.existsSync(filePath)) {
        this.warnings.push(`⚠️  Docker Compose file missing: ${file}`);
        return;
      }

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check if all services are defined
        this.services.forEach(service => {
          const serviceName = service.replace('-service', '');
          if (!content.includes(`${serviceName}-service:`)) {
            this.warnings.push(`⚠️  Service not defined in ${file}: ${service}`);
          }
        });

        console.log(`✅ ${file} validated`);
      } catch (error) {
        this.errors.push(`❌ Error reading ${file}: ${error.message}`);
      }
    });
  }

  validatePackageJson() {
    console.log('\n📦 Validating Package.json files...');
    
    this.services.forEach(service => {
      const packagePath = path.join(__dirname, '..', 'services', service, 'package.json');
      
      if (!fs.existsSync(packagePath)) {
        this.errors.push(`❌ package.json missing: ${service}`);
        return;
      }

      try {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        // Check required fields
        const requiredFields = ['name', 'version', 'main', 'scripts', 'dependencies'];
        requiredFields.forEach(field => {
          if (!packageJson[field]) {
            this.errors.push(`❌ Missing field in ${service}/package.json: ${field}`);
          }
        });

        // Check scripts
        const requiredScripts = ['build', 'start'];
        requiredScripts.forEach(script => {
          if (!packageJson.scripts || !packageJson.scripts[script]) {
            this.errors.push(`❌ Missing script in ${service}/package.json: ${script}`);
          }
        });

        // Check dependencies
        if (!packageJson.dependencies || Object.keys(packageJson.dependencies).length === 0) {
          this.warnings.push(`⚠️  No dependencies in ${service}/package.json`);
        }

        console.log(`✅ ${service}/package.json validated`);
      } catch (error) {
        this.errors.push(`❌ Error parsing ${service}/package.json: ${error.message}`);
      }
    });
  }

  validateTypeScript() {
    console.log('\n📝 Validating TypeScript configurations...');
    
    this.services.forEach(service => {
      const tsconfigPath = path.join(__dirname, '..', 'services', service, 'tsconfig.json');
      
      if (!fs.existsSync(tsconfigPath)) {
        this.errors.push(`❌ tsconfig.json missing: ${service}`);
        return;
      }

      try {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
        
        // Check required compiler options
        const requiredOptions = ['target', 'module', 'outDir', 'rootDir'];
        requiredOptions.forEach(option => {
          if (!tsconfig.compilerOptions || !tsconfig.compilerOptions[option]) {
            this.warnings.push(`⚠️  Missing TypeScript option in ${service}: ${option}`);
          }
        });

        console.log(`✅ ${service}/tsconfig.json validated`);
      } catch (error) {
        this.errors.push(`❌ Error parsing ${service}/tsconfig.json: ${error.message}`);
      }
    });
  }

  validateDockerfiles() {
    console.log('\n🐳 Validating Dockerfiles...');
    
    this.services.forEach(service => {
      const dockerfilePath = path.join(__dirname, '..', 'services', service, 'Dockerfile');
      
      if (!fs.existsSync(dockerfilePath)) {
        this.errors.push(`❌ Dockerfile missing: ${service}`);
        return;
      }

      try {
        const dockerfile = fs.readFileSync(dockerfilePath, 'utf8');
        
        // Check for multi-stage build
        if (!dockerfile.includes('FROM node:') || !dockerfile.includes('AS')) {
          this.warnings.push(`⚠️  Consider using multi-stage build for ${service}`);
        }

        // Check for security best practices
        if (!dockerfile.includes('USER')) {
          this.warnings.push(`⚠️  Consider running as non-root user in ${service}`);
        }

        if (!dockerfile.includes('HEALTHCHECK')) {
          this.warnings.push(`⚠️  Consider adding health check to ${service}`);
        }

        console.log(`✅ ${service}/Dockerfile validated`);
      } catch (error) {
        this.errors.push(`❌ Error reading ${service}/Dockerfile: ${error.message}`);
      }
    });
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 VALIDATION RESULTS');
    console.log('='.repeat(60));

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('🎉 All validations passed! Architecture is ready for deployment.');
    } else {
      if (this.errors.length > 0) {
        console.log('\n❌ ERRORS (Must be fixed):');
        this.errors.forEach(error => console.log(`  ${error}`));
      }

      if (this.warnings.length > 0) {
        console.log('\n⚠️  WARNINGS (Recommended to fix):');
        this.warnings.forEach(warning => console.log(`  ${warning}`));
      }
    }

    console.log('\n📈 SUMMARY:');
    console.log(`  ✅ Services validated: ${this.services.length}`);
    console.log(`  ❌ Errors: ${this.errors.length}`);
    console.log(`  ⚠️  Warnings: ${this.warnings.length}`);

    if (this.errors.length > 0) {
      console.log('\n🚨 Architecture validation failed. Please fix errors before deployment.');
      process.exit(1);
    } else {
      console.log('\n✅ Architecture validation successful!');
      process.exit(0);
    }
  }
}

// Run validation
const validator = new ArchitectureValidator();
validator.validate();
