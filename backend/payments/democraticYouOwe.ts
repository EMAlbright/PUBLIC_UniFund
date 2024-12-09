import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export const DemocraticPayByDebtor = async(paymentId: string, userId: string) => {
    // update owedDetails in the owedDetails of the paymentId
    // if the userId is not the logger, that means its the indebted person
    // update confirmedByDebtor to TRUE
    // if the userId is the logger, update confirmedByLogger to TRUE
    // if both of these values are TRUE then mark the transaction from 
    // pending to confirmed
    // actually this is for owe only
    // otherwise if we pass in 2 user id dont know who to confirm
    const paymentRef = doc(db, "payments", paymentId);
    const paymentDoc = await getDoc(paymentRef);
    const paymentData = paymentDoc.data();
    // update confirmedByDebtor to TRUE where UserId === UserId in owedDetails
    const updatedOwedDetails = paymentData.owedDetails.map((detail) => {
        if(detail.userId === userId){
            // if the logger logged the payment as received (true), update status to confirmed
            if(detail.confirmedByLogger === true){
                return {...detail, confirmedByDebtor: true, status: "confirmed"}
            }
            // else the indebted is the first to confirm the transaction so its partially confirmed
            else{
                return {...detail, confirmedByDebtor: true, status: "partial confirmation"}
            }
        }
        return detail
    })
  
    await updateDoc(paymentRef, {
        owedDetails: updatedOwedDetails 
    })
}