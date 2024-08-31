
import React from 'react';

const PaymentDetails = React.forwardRef(({ paymentDetails }, ref) => {
    return (
    <div  className=" hidden print:block payment-info bg-white p-5 rounded shadow mt-5" ref={ref}>
        <h2 className="text-2xl font-semibold mb-4">Payment Details</h2>
        <p><strong>User:</strong> {paymentDetails.user.username}</p>
        <p><strong>Property:</strong> {paymentDetails.listing.name}</p>
        <p><strong>Mpesa Receipt Number:</strong> {paymentDetails.mpesaReceiptNumber}</p>
        <p><strong>Amount Paid:</strong> {paymentDetails.amount}</p>
        <p><strong>Status:</strong> {paymentDetails.status}</p>
        <p><strong>Date:</strong> {new Date(paymentDetails.createdAt).toLocaleString()}</p>
    </div>
    );
});

export default PaymentDetails;
    