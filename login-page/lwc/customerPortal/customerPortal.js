import getBillingDetails from "@salesforce/apex/CommunityAuthenticator.getBillingDetails";
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { LightningElement } from "lwc";

export default class CustomerPortal extends NavigationMixin(LightningElement) {
  accounts = [];
  showModal = false;
  selectedAccount = {};
  isLoggedIn = true;
  countdown = 3;
  countdownInterval;
  errorCheck = false;
  errorMessage = "";

  connectedCallback() {
    this.checkLoggedInStatus();
  }

  async checkLoggedInStatus() {
    try {
      const encodedId = await this.fetchEncodedIdFromStorage();
      if (encodedId) {
        await this.getAccountBillingDetails(encodedId);
      } else {
        this.isLoggedIn = false;
        this.startCountdown();
      }
    } catch (error) {
      this.handleCatchError(error);
    }
  }

  async getAccountBillingDetails(encodedId) {
    try {
      const result = await getBillingDetails({ encodedId });
      this.accounts = result || [];
    } catch (error) {
      this.handleCatchError(error);
    }
  }

  async fetchEncodedIdFromStorage() {
    return new Promise((resolve) => {
      const encodedId = localStorage.getItem("loginId");
      resolve(encodedId);
    });
  }

  async logOut() {
    localStorage.clear()
    await this.redirectToHome();
  }

  startCountdown() {
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown === 0) {
        clearInterval(this.countdownInterval);
        this.redirectToHome();
      }
    }, 1000);
  }

  async redirectToHome() {
    this[NavigationMixin.Navigate](
      {
        type: "standard__webPage",
        attributes: {
          url: "./" 
        }
      },
      true
    );
  }

  showDetails(event) {
    const accountId = event.currentTarget.dataset.id;
    this.selectedAccount = this.accounts.find((acc) => acc.Id === accountId);
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedAccount = {};
  }

  handleCatchError(error) {
    const statusText = error?.statusText || "Unknown Error";
    const statusCode = error?.status || "N/A";
    const errorMessage = `${statusText} ${statusCode}`;
    const errorDetails = error?.body?.message || "Something went wrong";
    this.errorCheck = true;
    this.errorMessage = errorDetails;

    this.showToast(errorMessage, errorDetails, "error");
  }

  showToast(title, message, variant) {
    this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
  }
}