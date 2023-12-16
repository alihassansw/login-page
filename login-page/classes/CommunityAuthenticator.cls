public without sharing class CommunityAuthenticator {
  @AuraEnabled
  public static String authenticateCredentials(UserData data) {
    String email = data.email;
    String password = data.password;
    String encodedId = null;

    if (String.isNotBlank(email) && String.isNotBlank(password)) {
      List<Account> accounts = [
        SELECT Id
        FROM Account
        WHERE Community_Email__c = :email AND Community_Password__c = :password
        LIMIT 1
      ];

      if (accounts != null && !accounts.isEmpty()) {
        Account acc = accounts[0];
        if (acc.Id != null) {
          encodedId = EncodingUtil.base64Encode(Blob.valueOf(acc.Id));
        }
      }
    }

    return encodedId;
  }

  @AuraEnabled
  public static List<AcctSeed__Recurring_Billing__c> getBillingDetails(String encodedId) {
    List<AcctSeed__Recurring_Billing__c> billingDetails = new List<AcctSeed__Recurring_Billing__c>();
    String decodedId = EncodingUtil.base64Decode(encodedId).toString();
    try {
      if (decodedId != null) {
        billingDetails = [
          SELECT
            Id,
            Name,
            Revenue_Type__c,
            Account_Status__c,
            AcctSeed__Status__c,
            Subscription_Type__c,
            Subscription_End_Date__c,
            Subscription_Start_Date__c,
            AcctSeed__Annual_Amount__c,
            AcctSeed__Customer__r.Name,
            AcctSeed__Monthly_Amount__c,
            AcctSeed__Billing_Frequency__c,
            AcctSeed__Next_Billing_Date__c,
            AcctSeed__Last_Billing_Date__c
          FROM AcctSeed__Recurring_Billing__c
          WHERE AcctSeed__Customer__c = :decodedId
        ];
      }
    } catch (Exception e) {
      System.debug('Exception occurred: ' + e.getMessage());
    }
    return billingDetails;
  }

  public class UserData {
    @AuraEnabled
    public String email { get; set; }
    @AuraEnabled
    public String password { get; set; }
  }
}