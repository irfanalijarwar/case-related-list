@isTest
public class cmp_AvailableConfigsTest {
    @isTest
    public static void AvailableConfigsUnitTest(){
        
        Test.startTest();
        //create config
        Config__c config = new Config__c();
        config.Label__c = 'Test Label';
        config.Type__c = 'Test Type';
        config.Amount__c = 20.00;
        insert config;
        
        //create case
        Case cases = new Case();
        cases.Subject = 'Test Subject';
        cases.Status = 'Submitted';
        cases.Origin = 'Email';
        insert cases;
        
        //create caseConfig
        Case_Config__c caseConfig = new Case_Config__c();
        caseConfig.Label__c = 'Test Case Lable';
        caseConfig.Type__c = 'Test case type';
        caseConfig.Amount__c = 30.00;
        caseConfig.Case__c = cases.Id;
        insert caseConfig;
        
         Test.stopTest();
        
        //call cmp_AvailableConfigs method
        cmp_AvailableConfigs.getAvailableConfigs();
        
        String caseID = cases.Id;
        cmp_AvailableConfigs.getCaseStatus(caseID);
        
        List<String> checkCaseConfig = new List<String>();
        checkCaseConfig.add(caseConfig.Label__c);
        cmp_AvailableConfigs.checkCaseConfigs(checkCaseConfig, caseID);
        
        List<String> addCaseConfig = new List<String>();
        addCaseConfig.add(config.Label__c);
        cmp_AvailableConfigs.addCaseConfig(addCaseConfig, caseID);
        
        List<String> addCaseConfig1 = new List<String>();
        addCaseConfig1.add(config.Label__c);
        cmp_AvailableConfigs.addCaseConfig(addCaseConfig1, caseID);
        
       
        
    }

}