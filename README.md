# CSS 496 Capstone Project (Autumn 2024): UniFund  
## Cross-Platform Mobile Group Budgeting and Expense Tracking App  
![](assets/usage.png)
## Scan this image with your mobile device to try out UniFund. 
### *Note: Expo Go must be downloaded on your device
## Key Features  

### Group Financial Management  

- Create and manage group budgets  
- Track group spending habits  
- Transparently confirm payments between group members  


### Budget Types  
- Event-based budgets (e.g., road trips, movie outings)  
- Recurring budgets (e.g., rent, utilities, subscriptions)  
- Detailed category and subcategory tracking  

### Democratic Financial Decision Making  
- Group members can petition to edit budgets  
- Transactions require mutual confirmation  
- Promotes accountability and transparency  



## Core Functionalities  
- User authentication and profile management  
- Group creation and invitation system  
- Budget creation and management

  - Single-event budgets  
  - Recurring budgets  
  - Category and subcategory allocation  


### Expense logging and splitting  
- Transaction tracking with mutual confirmation  
- Notification system for group invites and updates  

### Technical Stack  

- **Platform:** Expo Go (Cross-platform iOS and Android)  

**Frontend:**  
- React Native  
- TypeScript  
  
**Backend:**  
- Firebase Firestore  
- TypeScript Firebase functions

## Project Motivation
The application was developed to solve real-world financial challenges faced by groups, particularly:

- Reducing financial stress in shared living situations
- Promoting transparent and fair expense tracking
- Facilitating democratic financial decision-making
- Strengthening group dynamics and personal relationships

## Source Code Overview
- ```app/``` contains the source code for the app's tabs and routing.
  - ```(screens)/``` contains the notification screen.
  - ```(tabs)/``` contains the budget, transaction, and profile tabs.
- Each root/sub folder contain a ```_layout.tsx```, which contains the routing for the app.

- ```backend/``` contains all related firebase TS functions in order to either:
  - Delete, update, create, and  fetch from my firestore database.
  - ```budgetFunctions/``` contains all related functions to event and recurring budgets, mainly within the budget page of the app.
  - ```chartFunctions/``` contains all related functions to the main chart of the user profile page.
  - ```groupFunctions/``` contains all related functions to **deleting/creating** groups, adding members to groups, and transferring group ownership.
  - ```payments/``` contains all related functions to handling how payments are verified when users double tap transactions in the **transaction page**.
  - ```petitionFunctions/``` contains all related functions to creating as well as executing petitions created by users.
- ```components/```
  - Contains almost all of the **UI Components** for this applications. Almost all of the transaction and budget tab UI is handled here, as the profile tab is mainly in ```app/(tabs)/profile.tsx```.
  - ```budgetPage/``` contains all the components related to the budget tab including:
    - ```budgetToolbar/```, the top toolbar of the tab which defines how to switch between the event budget, recurring budget, and expense pages.
    - ```buttons/```, contains all buttons related to UI components on the budget tab.
    - ```pages/```, contains all entry point pages (```/eventBudget.tsx, expensepage.tsx, recurringBudgetpage.tsx, petitionDispute/petition.tsx```) to each page in the budget tab.
    - ```viewBudgets/```, contains all the logic around fetching and displaying data for the appropriate page.
  - ```transactionPage/``` contains only 3 files (```youOwe.tsx, youOwed.tsx, confirmed.tsx```), all of which are the pages for the transaction tab.
  - The rest of the files at the **root** are mainly used in the **profile tab**. This includes files such as ```userSearchbar.tsx, viewGroups.tsx, logoutButton.tsx, etc.```

- ```functions/``` is the container for all of the cloud firebase functions. Almost all of my backend logic is handled on the client-side, as I did not want to pay for using cloud functions. All of the functions I would have ideally implemented as cloud functions can be found in ```/backend```.
- ```App.tsx``` serves as the main entry way to the application.
