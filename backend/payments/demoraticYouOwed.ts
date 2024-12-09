import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

// user id is the user who owes the logger
export const DemocraticPayByLogger = async(paymentId: string, userId: string) => {
    const paymentRef = doc(db, "payments", paymentId);
    const paymentDoc = await getDoc(paymentRef);
    const paymentData = paymentDoc.data();
    // update confirmedByDebtor to TRUE where UserId === UserId in owedDetails
    const updatedOwedDetails = paymentData.owedDetails.map((detail) => {
        if(detail.userId === userId){
            // if the logger logged the payment as received (true), update status to confirmed
            if(detail.confirmedByDebtor === true){
                return {...detail, confirmedByLogger: true, status: "confirmed"}
            }
            // else the indebted is the first to confirm the transaction so its partially confirmed
            else{
                return {...detail, confirmedByLogger: true, status: "partial confirmation"}
            }
        }
        return detail
    })
  
    await updateDoc(paymentRef, {
        owedDetails: updatedOwedDetails 
    })
}
