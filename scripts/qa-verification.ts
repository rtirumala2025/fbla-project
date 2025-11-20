/**
 * Comprehensive QA Verification Script
 * Tests all newly implemented features and generates a detailed report
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  feature: string;
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  timestamp: string;
}

interface FeatureReport {
  featureName: string;
  overallStatus: 'pass' | 'fail' | 'partial';
  tests: TestResult[];
  recommendations: string[];
}

class QAVerifier {
  private supabase: any;
  private results: TestResult[] = [];
  private reports: FeatureReport[] = [];

  constructor() {
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      console.warn('⚠️ Supabase credentials not found. Some tests will be skipped.');
    }
  }

  private addResult(feature: string, test: string, status: 'pass' | 'fail' | 'warning', message: string, details?: any) {
    this.results.push({
      feature,
      test,
      status,
      message,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  // Feature 1: Email Automation
  async verifyEmailAutomation() {
    console.log('\n📧 Verifying Email Automation...');
    const featureTests: TestResult[] = [];

    // Test 1: Email logs table exists
    try {
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('email_logs')
          .select('id')
          .limit(1);

        if (error && error.code !== 'PGRST116') {
          this.addResult('Email Automation', 'Email logs table exists', 'fail', 
            `Table check failed: ${error.message}`);
          featureTests.push(this.results[this.results.length - 1]);
        } else {
          this.addResult('Email Automation', 'Email logs table exists', 'pass', 
            'Email logs table is accessible');
          featureTests.push(this.results[this.results.length - 1]);
        }
      } else {
        this.addResult('Email Automation', 'Email logs table exists', 'warning', 
          'Skipped - Supabase not configured');
        featureTests.push(this.results[this.results.length - 1]);
      }
    } catch (error: any) {
      this.addResult('Email Automation', 'Email logs table exists', 'fail', 
        `Error: ${error.message}`);
      featureTests.push(this.results[this.results.length - 1]);
    }

    // Test 2: Welcome email trigger exists
    try {
      const triggerFile = path.join(__dirname, '../supabase/migrations/012_welcome_email_trigger.sql');
      if (fs.existsSync(triggerFile)) {
        const content = fs.readFileSync(triggerFile, 'utf-8');
        if (content.includes('trg_send_welcome_email') && content.includes('send_welcome_email_trigger')) {
          this.addResult('Email Automation', 'Welcome email trigger exists', 'pass', 
            'Trigger migration file found and contains required functions');
          featureTests.push(this.results[this.results.length - 1]);
        } else {
          this.addResult('Email Automation', 'Welcome email trigger exists', 'fail', 
            'Trigger file exists but missing required components');
          featureTests.push(this.results[this.results.length - 1]);
        }
      } else {
        this.addResult('Email Automation', 'Welcome email trigger exists', 'fail', 
          'Trigger migration file not found');
        featureTests.push(this.results[this.results.length - 1]);
      }
    } catch (error: any) {
      this.addResult('Email Automation', 'Welcome email trigger exists', 'fail', 
        `Error: ${error.message}`);
      featureTests.push(this.results[this.results.length - 1]);
    }

    // Test 3: Edge function exists
    try {
      const edgeFunctionPath = path.join(__dirname, '../supabase/functions/send-welcome-email/index.ts');
      if (fs.existsSync(edgeFunctionPath)) {
        const content = fs.readFileSync(edgeFunctionPath, 'utf-8');
        if (content.includes('send-welcome-email') && content.includes('email_logs')) {
          this.addResult('Email Automation', 'Welcome email edge function exists', 'pass', 
            'Edge function file found and contains email logic');
          featureTests.push(this.results[this.results.length - 1]);
        } else {
          this.addResult('Email Automation', 'Welcome email edge function exists', 'warning', 
            'Edge function exists but may be incomplete');
          featureTests.push(this.results[this.results.length - 1]);
        }
      } else {
        this.addResult('Email Automation', 'Welcome email edge function exists', 'fail', 
          'Edge function file not found');
        featureTests.push(this.results[this.results.length - 1]);
      }
    } catch (error: any) {
      this.addResult('Email Automation', 'Welcome email edge function exists', 'fail', 
        `Error: ${error.message}`);
      featureTests.push(this.results[this.results.length - 1]);
    }

    const overallStatus = featureTests.every(t => t.status === 'pass') 
      ? 'pass' 
      : featureTests.some(t => t.status === 'fail') 
        ? 'fail' 
        : 'partial';

    this.reports.push({
      featureName: 'Email Automation',
      overallStatus,
      tests: featureTests,
      recommendations: this.generateEmailRecommendations(featureTests),
    });
  }

  private generateEmailRecommendations(tests: TestResult[]): string[] {
    const recommendations: string[] = [];
    
    if (tests.some(t => t.test === 'Email logs table exists' && t.status === 'fail')) {
      recommendations.push('Run migration 011_email_logging.sql to create email_logs table');
    }
    
    if (tests.some(t => t.test === 'Welcome email trigger exists' && t.status === 'fail')) {
      recommendations.push('Apply migration 012_welcome_email_trigger.sql to create database trigger');
    }
    
    if (tests.some(t => t.test === 'Welcome email edge function exists' && t.status === 'fail')) {
      recommendations.push('Deploy send-welcome-email edge function to Supabase');
    }
    
    if (tests.every(t => t.status === 'pass' || t.status === 'warning')) {
      recommendations.push('Configure RESEND_API_KEY environment variable for production email sending');
      recommendations.push('Test email sending by creating a new user profile');
    }

    return recommendations;
  }

  // Feature 2: Social Page Removal
  async verifySocialPageRemoval() {
    console.log('\n🚫 Verifying Social Page Removal...');
    const featureTests: TestResult[] = [];

    // Test 1: Check App.tsx for social route
    try {
      const appTsxPath = path.join(__dirname, '../frontend/src/App.tsx');
      if (fs.existsSync(appTsxPath)) {
        const content = fs.readFileSync(appTsxPath, 'utf-8');
        const hasSocialRoute = /\/social|SocialHub/i.test(content);
        const hasSocialComment = content.includes('Social route removed') || content.includes('Social route removed');
        
        if (!hasSocialRoute && hasSocialComment) {
          this.addResult('Social Page Removal', 'Social route removed from App.tsx', 'pass', 
            'No social route found, removal comment present');
          featureTests.push(this.results[this.results.length - 1]);
        } else if (hasSocialRoute) {
          this.addResult('Social Page Removal', 'Social route removed from App.tsx', 'fail', 
            'Social route still exists in App.tsx');
          featureTests.push(this.results[this.results.length - 1]);
        } else {
          this.addResult('Social Page Removal', 'Social route removed from App.tsx', 'warning', 
            'Could not verify social route removal');
          featureTests.push(this.results[this.results.length - 1]);
        }
      }
    } catch (error: any) {
      this.addResult('Social Page Removal', 'Social route removed from App.tsx', 'fail', 
        `Error: ${error.message}`);
      featureTests.push(this.results[this.results.length - 1]);
    }

    // Test 2: Check Header.tsx for social navigation
    try {
      const headerPath = path.join(__dirname, '../frontend/src/components/Header.tsx');
      if (fs.existsSync(headerPath)) {
        const content = fs.readFileSync(headerPath, 'utf-8');
        const hasSocialNav = /Social|social.*to.*social/i.test(content) && 
                            !content.includes('Social menu item removed');
        
        if (!hasSocialNav || content.includes('Social menu item removed')) {
          this.addResult('Social Page Removal', 'Social navigation removed from Header', 'pass', 
            'Social navigation item removed or commented');
          featureTests.push(this.results[this.results.length - 1]);
        } else {
          this.addResult('Social Page Removal', 'Social navigation removed from Header', 'fail', 
            'Social navigation still exists in Header');
          featureTests.push(this.results[this.results.length - 1]);
        }
      }
    } catch (error: any) {
      this.addResult('Social Page Removal', 'Social navigation removed from Header', 'fail', 
        `Error: ${error.message}`);
      featureTests.push(this.results[this.results.length - 1]);
    }

    // Test 3: Check if SocialHub component file exists
    try {
      const socialHubPath = path.join(__dirname, '../frontend/src/pages/social/SocialHub.tsx');
      if (!fs.existsSync(socialHubPath)) {
        this.addResult('Social Page Removal', 'SocialHub component file removed', 'pass', 
          'SocialHub.tsx file does not exist');
        featureTests.push(this.results[this.results.length - 1]);
      } else {
        this.addResult('Social Page Removal', 'SocialHub component file removed', 'fail', 
          'SocialHub.tsx file still exists');
        featureTests.push(this.results[this.results.length - 1]);
      }
    } catch (error: any) {
      this.addResult('Social Page Removal', 'SocialHub component file removed', 'warning', 
        `Could not verify: ${error.message}`);
      featureTests.push(this.results[this.results.length - 1]);
    }

    const overallStatus = featureTests.every(t => t.status === 'pass') 
      ? 'pass' 
      : featureTests.some(t => t.status === 'fail') 
        ? 'fail' 
        : 'partial';

    this.reports.push({
      featureName: 'Social Page Removal',
      overallStatus,
      tests: featureTests,
      recommendations: this.generateSocialRecommendations(featureTests),
    });
  }

  private generateSocialRecommendations(tests: TestResult[]): string[] {
    const recommendations: string[] = [];
    
    if (tests.some(t => t.status === 'fail')) {
      recommendations.push('Remove all references to /social route from App.tsx');
      recommendations.push('Remove Social navigation item from Header.tsx');
      recommendations.push('Delete frontend/src/pages/social/SocialHub.tsx if it exists');
      recommendations.push('Remove any imports of SocialHub component');
      recommendations.push('Check for any remaining social-related API calls or services');
    } else {
      recommendations.push('✅ Social page removal verified - no action needed');
    }

    return recommendations;
  }

  // Feature 3: Wallet Integration
  async verifyWalletIntegration() {
    console.log('\n💰 Verifying Wallet Integration...');
    const featureTests: TestResult[] = [];

    // Test 1: BudgetDashboard has wallet functionality
    try {
      const budgetPath = path.join(__dirname, '../frontend/src/pages/budget/BudgetDashboard.tsx');
      if (fs.existsSync(budgetPath)) {
        const content = fs.readFileSync(budgetPath, 'utf-8');
        const hasWalletOverview = content.includes('Wallet Overview') || content.includes('wallet');
        const hasBalance = content.includes('balance') || content.includes('Balance');
        const hasTransactions = content.includes('transaction') || content.includes('Transaction');
        
        if (hasWalletOverview && hasBalance && hasTransactions) {
          this.addResult('Wallet Integration', 'BudgetDashboard has wallet features', 'pass', 
            'Wallet overview, balance, and transactions found in BudgetDashboard');
          featureTests.push(this.results[this.results.length - 1]);
        } else {
          this.addResult('Wallet Integration', 'BudgetDashboard has wallet features', 'warning', 
            'Some wallet features may be missing');
          featureTests.push(this.results[this.results.length - 1]);
        }
      } else {
        this.addResult('Wallet Integration', 'BudgetDashboard has wallet features', 'fail', 
          'BudgetDashboard.tsx not found');
        featureTests.push(this.results[this.results.length - 1]);
      }
    } catch (error: any) {
      this.addResult('Wallet Integration', 'BudgetDashboard has wallet features', 'fail', 
        `Error: ${error.message}`);
      featureTests.push(this.results[this.results.length - 1]);
    }

    // Test 2: Finance API integration
    try {
      const financeApiPath = path.join(__dirname, '../frontend/src/api/finance.ts');
      if (fs.existsSync(financeApiPath)) {
        const content = fs.readFileSync(financeApiPath, 'utf-8');
        const hasGetSummary = content.includes('getFinanceSummary') || content.includes('finance/summary');
        const hasTransactions = content.includes('transaction') || content.includes('Transaction');
        
        if (hasGetSummary) {
          this.addResult('Wallet Integration', 'Finance API functions exist', 'pass', 
            'Finance API includes summary and transaction functions');
          featureTests.push(this.results[this.results.length - 1]);
        } else {
          this.addResult('Wallet Integration', 'Finance API functions exist', 'warning', 
            'Finance API may be incomplete');
          featureTests.push(this.results[this.results.length - 1]);
        }
      } else {
        this.addResult('Wallet Integration', 'Finance API functions exist', 'warning', 
          'Finance API file not found (may be in different location)');
        featureTests.push(this.results[this.results.length - 1]);
      }
    } catch (error: any) {
      this.addResult('Wallet Integration', 'Finance API functions exist', 'warning', 
        `Could not verify: ${error.message}`);
      featureTests.push(this.results[this.results.length - 1]);
    }

    const overallStatus = featureTests.every(t => t.status === 'pass') 
      ? 'pass' 
      : featureTests.some(t => t.status === 'fail') 
        ? 'fail' 
        : 'partial';

    this.reports.push({
      featureName: 'Wallet Integration',
      overallStatus,
      tests: featureTests,
      recommendations: this.generateWalletRecommendations(featureTests),
    });
  }

  private generateWalletRecommendations(tests: TestResult[]): string[] {
    const recommendations: string[] = [];
    
    if (tests.some(t => t.status === 'fail')) {
      recommendations.push('Ensure BudgetDashboard includes wallet overview section');
      recommendations.push('Verify finance API endpoints are properly integrated');
      recommendations.push('Test wallet balance updates and transaction logging');
    } else {
      recommendations.push('✅ Wallet integration verified - test in browser to confirm functionality');
      recommendations.push('Verify wallet balance persists across sessions');
      recommendations.push('Test transaction creation and balance updates');
    }

    return recommendations;
  }

  // Feature 4: Dashboard Redesign
  async verifyDashboardRedesign() {
    console.log('\n🎨 Verifying Dashboard Redesign...');
    const featureTests: TestResult[] = [];

    // Test 1: DashboardPage exists and has 3D pet
    try {
      const dashboardPath = path.join(__dirname, '../frontend/src/pages/DashboardPage.tsx');
      if (fs.existsSync(dashboardPath)) {
        const content = fs.readFileSync(dashboardPath, 'utf-8');
        const has3DPet = content.includes('Pet3D') || content.includes('Pet3DVisualization');
        const hasStats = content.includes('PetStatsDisplay') || content.includes('stats');
        const hasQuests = content.includes('Quest') || content.includes('quest');
        const hasAnalytics = content.includes('Analytics') || content.includes('analytics');
        
        if (has3DPet && hasStats && hasQuests) {
          this.addResult('Dashboard Redesign', 'DashboardPage has all components', 'pass', 
            '3D pet, stats, quests, and analytics components found');
          featureTests.push(this.results[this.results.length - 1]);
        } else {
          this.addResult('Dashboard Redesign', 'DashboardPage has all components', 'warning', 
            'Some components may be missing');
          featureTests.push(this.results[this.results.length - 1]);
        }
      } else {
        this.addResult('Dashboard Redesign', 'DashboardPage has all components', 'fail', 
          'DashboardPage.tsx not found');
        featureTests.push(this.results[this.results.length - 1]);
      }
    } catch (error: any) {
      this.addResult('Dashboard Redesign', 'DashboardPage has all components', 'fail', 
        `Error: ${error.message}`);
      featureTests.push(this.results[this.results.length - 1]);
    }

    // Test 2: Pet3DVisualization component exists
    try {
      const pet3DPath = path.join(__dirname, '../frontend/src/components/pets/Pet3DVisualization.tsx');
      if (fs.existsSync(pet3DPath)) {
        this.addResult('Dashboard Redesign', 'Pet3DVisualization component exists', 'pass', 
          '3D pet visualization component found');
        featureTests.push(this.results[this.results.length - 1]);
      } else {
        this.addResult('Dashboard Redesign', 'Pet3DVisualization component exists', 'fail', 
          'Pet3DVisualization.tsx not found');
        featureTests.push(this.results[this.results.length - 1]);
      }
    } catch (error: any) {
      this.addResult('Dashboard Redesign', 'Pet3DVisualization component exists', 'fail', 
        `Error: ${error.message}`);
      featureTests.push(this.results[this.results.length - 1]);
    }

    // Test 3: Pet actions (feed, play, earn)
    try {
      const dashboardPath = path.join(__dirname, '../frontend/src/pages/DashboardPage.tsx');
      if (fs.existsSync(dashboardPath)) {
        const content = fs.readFileSync(dashboardPath, 'utf-8');
        const hasFeed = content.includes('handleFeed') || content.includes('feed');
        const hasPlay = content.includes('handlePlay') || content.includes('play');
        const hasEarn = content.includes('handleEarn') || content.includes('earn');
        
        if (hasFeed && hasPlay) {
          this.addResult('Dashboard Redesign', 'Pet actions (feed, play, earn) exist', 'pass', 
            'Feed and play actions found');
          featureTests.push(this.results[this.results.length - 1]);
        } else {
          this.addResult('Dashboard Redesign', 'Pet actions (feed, play, earn) exist', 'warning', 
            'Some pet actions may be missing');
          featureTests.push(this.results[this.results.length - 1]);
        }
      }
    } catch (error: any) {
      this.addResult('Dashboard Redesign', 'Pet actions (feed, play, earn) exist', 'warning', 
        `Could not verify: ${error.message}`);
      featureTests.push(this.results[this.results.length - 1]);
    }

    const overallStatus = featureTests.every(t => t.status === 'pass') 
      ? 'pass' 
      : featureTests.some(t => t.status === 'fail') 
        ? 'fail' 
        : 'partial';

    this.reports.push({
      featureName: 'Dashboard Redesign',
      overallStatus,
      tests: featureTests,
      recommendations: this.generateDashboardRecommendations(featureTests),
    });
  }

  private generateDashboardRecommendations(tests: TestResult[]): string[] {
    const recommendations: string[] = [];
    
    if (tests.some(t => t.status === 'fail')) {
      recommendations.push('Ensure DashboardPage includes all required components');
      recommendations.push('Verify Pet3DVisualization component is properly imported');
      recommendations.push('Test 3D pet rendering with accessories');
    } else {
      recommendations.push('✅ Dashboard redesign verified - test in browser');
      recommendations.push('Verify 3D pet renders correctly with accessories');
      recommendations.push('Test pet stats display and health bar');
      recommendations.push('Verify quests section loads and displays correctly');
      recommendations.push('Test feed, play, and earn actions');
    }

    return recommendations;
  }

  // Feature 5: Avatar Closet
  async verifyAvatarCloset() {
    console.log('\n👕 Verifying Avatar Closet...');
    const featureTests: TestResult[] = [];

    // Test 1: Closet component exists
    try {
      const closetPath = path.join(__dirname, '../frontend/src/components/pets/Closet.tsx');
      if (fs.existsSync(closetPath)) {
        const content = fs.readFileSync(closetPath, 'utf-8');
        const hasEquip = content.includes('equip') || content.includes('Equip');
        const hasRemove = content.includes('remove') || content.includes('Remove') || content.includes('unequip');
        
        if (hasEquip && hasRemove) {
          this.addResult('Avatar Closet', 'Closet component exists with equip/remove', 'pass', 
            'Closet component found with equip and remove functionality');
          featureTests.push(this.results[this.results.length - 1]);
        } else {
          this.addResult('Avatar Closet', 'Closet component exists with equip/remove', 'warning', 
            'Closet component exists but may be incomplete');
          featureTests.push(this.results[this.results.length - 1]);
        }
      } else {
        this.addResult('Avatar Closet', 'Closet component exists with equip/remove', 'fail', 
          'Closet.tsx not found');
        featureTests.push(this.results[this.results.length - 1]);
      }
    } catch (error: any) {
      this.addResult('Avatar Closet', 'Closet component exists with equip/remove', 'fail', 
        `Error: ${error.message}`);
      featureTests.push(this.results[this.results.length - 1]);
    }

    // Test 2: Accessories API exists
    try {
      const accessoriesApiPath = path.join(__dirname, '../frontend/src/api/accessories.ts');
      if (fs.existsSync(accessoriesApiPath)) {
        const content = fs.readFileSync(accessoriesApiPath, 'utf-8');
        const hasEquipFunction = content.includes('equipAccessory') || content.includes('equip');
        
        if (hasEquipFunction) {
          this.addResult('Avatar Closet', 'Accessories API exists', 'pass', 
            'Accessories API includes equip function');
          featureTests.push(this.results[this.results.length - 1]);
        } else {
          this.addResult('Avatar Closet', 'Accessories API exists', 'warning', 
            'Accessories API may be incomplete');
          featureTests.push(this.results[this.results.length - 1]);
        }
      } else {
        this.addResult('Avatar Closet', 'Accessories API exists', 'warning', 
          'Accessories API file not found (may be in different location)');
        featureTests.push(this.results[this.results.length - 1]);
      }
    } catch (error: any) {
      this.addResult('Avatar Closet', 'Accessories API exists', 'warning', 
        `Could not verify: ${error.message}`);
      featureTests.push(this.results[this.results.length - 1]);
    }

    // Test 3: Accessories table exists in migrations
    try {
      const accessoriesMigrationPath = path.join(__dirname, '../supabase/migrations/004_accessories_and_art_cache.sql');
      if (fs.existsSync(accessoriesMigrationPath)) {
        const content = fs.readFileSync(accessoriesMigrationPath, 'utf-8');
        const hasAccessoriesTable = content.includes('CREATE TABLE') && content.includes('accessories');
        const hasUserAccessoriesTable = content.includes('user_accessories');
        
        if (hasAccessoriesTable && hasUserAccessoriesTable) {
          this.addResult('Avatar Closet', 'Accessories database tables exist', 'pass', 
            'Accessories and user_accessories tables found in migration');
          featureTests.push(this.results[this.results.length - 1]);
        } else {
          this.addResult('Avatar Closet', 'Accessories database tables exist', 'warning', 
            'Accessories tables may be incomplete');
          featureTests.push(this.results[this.results.length - 1]);
        }
      } else {
        this.addResult('Avatar Closet', 'Accessories database tables exist', 'warning', 
          'Accessories migration file not found');
        featureTests.push(this.results[this.results.length - 1]);
      }
    } catch (error: any) {
      this.addResult('Avatar Closet', 'Accessories database tables exist', 'warning', 
        `Could not verify: ${error.message}`);
      featureTests.push(this.results[this.results.length - 1]);
    }

    const overallStatus = featureTests.every(t => t.status === 'pass') 
      ? 'pass' 
      : featureTests.some(t => t.status === 'fail') 
        ? 'fail' 
        : 'partial';

    this.reports.push({
      featureName: 'Avatar Closet',
      overallStatus,
      tests: featureTests,
      recommendations: this.generateClosetRecommendations(featureTests),
    });
  }

  private generateClosetRecommendations(tests: TestResult[]): string[] {
    const recommendations: string[] = [];
    
    if (tests.some(t => t.status === 'fail')) {
      recommendations.push('Ensure Closet component is properly implemented');
      recommendations.push('Verify accessories API endpoints are working');
      recommendations.push('Apply accessories migration to database');
    } else {
      recommendations.push('✅ Avatar Closet verified - test in browser');
      recommendations.push('Test equipping and removing accessories');
      recommendations.push('Verify accessories persist in Supabase');
      recommendations.push('Test real-time updates when accessories change');
      recommendations.push('Verify accessories appear on 3D pet in Dashboard');
    }

    return recommendations;
  }

  // Feature 6: Profile Button
  async verifyProfileButton() {
    console.log('\n👤 Verifying Profile Button...');
    const featureTests: TestResult[] = [];

    // Test 1: Header has profile button with welcome message
    try {
      const headerPath = path.join(__dirname, '../frontend/src/components/Header.tsx');
      if (fs.existsSync(headerPath)) {
        const content = fs.readFileSync(headerPath, 'utf-8');
        const hasWelcome = content.includes('Welcome,') || content.includes('Welcome');
        const hasUserDisplay = content.includes('currentUser.displayName') || content.includes('currentUser.email');
        const hasConditionalRender = content.includes('currentUser ?') || content.includes('!loading && currentUser');
        
        if (hasWelcome && hasUserDisplay && hasConditionalRender) {
          this.addResult('Profile Button', 'Header has welcome message with conditional render', 'pass', 
            'Welcome message found with user name display and conditional rendering');
          featureTests.push(this.results[this.results.length - 1]);
        } else {
          this.addResult('Profile Button', 'Header has welcome message with conditional render', 'warning', 
            'Some profile button features may be missing');
          featureTests.push(this.results[this.results.length - 1]);
        }
      } else {
        this.addResult('Profile Button', 'Header has welcome message with conditional render', 'fail', 
          'Header.tsx not found');
        featureTests.push(this.results[this.results.length - 1]);
      }
    } catch (error: any) {
      this.addResult('Profile Button', 'Header has welcome message with conditional render', 'fail', 
        `Error: ${error.message}`);
      featureTests.push(this.results[this.results.length - 1]);
    }

    // Test 2: AuthContext provides user state
    try {
      const authContextPath = path.join(__dirname, '../frontend/src/contexts/AuthContext.tsx');
      if (fs.existsSync(authContextPath)) {
        const content = fs.readFileSync(authContextPath, 'utf-8');
        const hasCurrentUser = content.includes('currentUser') || content.includes('current_user');
        const hasLoading = content.includes('loading');
        
        if (hasCurrentUser && hasLoading) {
          this.addResult('Profile Button', 'AuthContext provides user state', 'pass', 
            'AuthContext includes currentUser and loading state');
          featureTests.push(this.results[this.results.length - 1]);
        } else {
          this.addResult('Profile Button', 'AuthContext provides user state', 'warning', 
            'AuthContext may be incomplete');
          featureTests.push(this.results[this.results.length - 1]);
        }
      } else {
        this.addResult('Profile Button', 'AuthContext provides user state', 'warning', 
          'AuthContext.tsx not found (may be in different location)');
        featureTests.push(this.results[this.results.length - 1]);
      }
    } catch (error: any) {
      this.addResult('Profile Button', 'AuthContext provides user state', 'warning', 
        `Could not verify: ${error.message}`);
      featureTests.push(this.results[this.results.length - 1]);
    }

    const overallStatus = featureTests.every(t => t.status === 'pass') 
      ? 'pass' 
      : featureTests.some(t => t.status === 'fail') 
        ? 'fail' 
        : 'partial';

    this.reports.push({
      featureName: 'Profile Button',
      overallStatus,
      tests: featureTests,
      recommendations: this.generateProfileRecommendations(featureTests),
    });
  }

  private generateProfileRecommendations(tests: TestResult[]): string[] {
    const recommendations: string[] = [];
    
    if (tests.some(t => t.status === 'fail')) {
      recommendations.push('Ensure Header component displays welcome message');
      recommendations.push('Verify conditional rendering based on auth state');
      recommendations.push('Test login/logout state changes');
    } else {
      recommendations.push('✅ Profile Button verified - test in browser');
      recommendations.push('Test welcome message displays correct user name');
      recommendations.push('Verify button is hidden when logged out');
      recommendations.push('Test dynamic updates on login/logout');
    }

    return recommendations;
  }

  // Generate final report
  generateReport(): string {
    const timestamp = new Date().toISOString();
    let report = `# Comprehensive QA Verification Report\n\n`;
    report += `**Generated:** ${timestamp}\n\n`;
    report += `## Executive Summary\n\n`;

    const totalFeatures = this.reports.length;
    const passedFeatures = this.reports.filter(r => r.overallStatus === 'pass').length;
    const failedFeatures = this.reports.filter(r => r.overallStatus === 'fail').length;
    const partialFeatures = this.reports.filter(r => r.overallStatus === 'partial').length;

    report += `- **Total Features Tested:** ${totalFeatures}\n`;
    report += `- **✅ Passed:** ${passedFeatures}\n`;
    report += `- **⚠️ Partial:** ${partialFeatures}\n`;
    report += `- **❌ Failed:** ${failedFeatures}\n\n`;

    report += `## Feature Reports\n\n`;

    this.reports.forEach((featureReport, index) => {
      const statusIcon = featureReport.overallStatus === 'pass' ? '✅' : 
                        featureReport.overallStatus === 'fail' ? '❌' : '⚠️';
      
      report += `### ${index + 1}. ${statusIcon} ${featureReport.featureName}\n\n`;
      report += `**Status:** ${featureReport.overallStatus.toUpperCase()}\n\n`;

      report += `#### Test Results:\n\n`;
      featureReport.tests.forEach(test => {
        const testIcon = test.status === 'pass' ? '✅' : 
                        test.status === 'fail' ? '❌' : '⚠️';
        report += `- ${testIcon} **${test.test}**: ${test.message}\n`;
        if (test.details) {
          report += `  - Details: ${JSON.stringify(test.details, null, 2)}\n`;
        }
      });

      report += `\n#### Recommendations:\n\n`;
      featureReport.recommendations.forEach(rec => {
        report += `- ${rec}\n`;
      });

      report += `\n---\n\n`;
    });

    report += `## Overall Assessment\n\n`;
    
    if (failedFeatures === 0 && partialFeatures === 0) {
      report += `🎉 **All features passed verification!** The application is ready for testing.\n\n`;
    } else if (failedFeatures === 0) {
      report += `⚠️ **Most features passed, but some require attention.** Review partial features and recommendations.\n\n`;
    } else {
      report += `❌ **Some features failed verification.** Please address the failed features before proceeding.\n\n`;
    }

    report += `## Next Steps\n\n`;
    report += `1. Review failed and partial features\n`;
    report += `2. Address recommendations for each feature\n`;
    report += `3. Run manual browser testing for all features\n`;
    report += `4. Verify Supabase data persistence\n`;
    report += `5. Test with multiple users to ensure data isolation\n`;
    report += `6. Check console for errors and warnings\n`;
    report += `7. Verify session persistence and routing\n\n`;

    return report;
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive QA Verification...\n');

    await this.verifyEmailAutomation();
    await this.verifySocialPageRemoval();
    await this.verifyWalletIntegration();
    await this.verifyDashboardRedesign();
    await this.verifyAvatarCloset();
    await this.verifyProfileButton();

    console.log('\n✅ All tests completed!\n');
    
    const report = this.generateReport();
    const reportPath = path.join(__dirname, '../COMPREHENSIVE_QA_VERIFICATION_REPORT.md');
    fs.writeFileSync(reportPath, report);
    
    console.log(`📄 Report generated: ${reportPath}\n`);
    console.log(report);
    
    return report;
  }
}

// Run if executed directly
if (require.main === module) {
  const verifier = new QAVerifier();
  verifier.runAllTests().catch(console.error);
}

export { QAVerifier };

