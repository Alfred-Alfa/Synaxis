import React from 'react';
import './AccountDeletionPolicy.css';

export const AccountDeletionPolicy: React.FC = () => {
    return (
        <div className="policy-container">
            <div className="policy-header">
                <h1>Account Deletion Policy</h1>
                <p>EliteCraft HRMS Mobile Application</p>
            </div>

            <div className="policy-section">
                <h2>Overview</h2>
                <p>
                    This policy outlines the procedures and conditions regarding the deletion of user accounts
                    within the EliteCraft HRMS mobile application and associated services. We are committed
                    to protecting your privacy and ensuring transparency about how your data is handled.
                </p>
            </div>

            <div className="policy-section">
                <h2>How Accounts Are Managed</h2>
                <p>
                    The EliteCraft HRMS application is an enterprise-grade Human Resource Management System
                    intended for use by employees of our partner organizations. User accounts are created,
                    managed, and maintained by the organization's system administrators.
                </p>
            </div>

            <div className="policy-section">
                <h2>Account Deletion Process</h2>
                <p>
                    Unlike consumer applications, users cannot unilaterally delete their accounts directly
                    from the mobile app settings. This is because your account is tied to your employment
                    records, payroll data, and legal compliance documents which the organization is required
                    to retain for specific periods.
                </p>
                <p><strong>Deletion occurs under the following circumstances:</strong></p>
                <ul>
                    <li>
                        <strong>Termination of Employment:</strong> Upon the end of your contract or
                        employment, your access to the system will be revoked by the administrator.
                        Your personal data will be archived or deleted in accordance with the organization's
                        data retention policy and local labor laws.
                    </li>
                    <li>
                        <strong>Administrative Action:</strong> System administrators have full authority to
                        deactivate or delete user accounts at any time for security or compliance reasons.
                    </li>
                    <li>
                        <strong>Request for Removal:</strong> If you believe your account exists in error
                        or you wish to request earlier removal of specific non-essential data, you must
                        contact your organization's HR department or System Administrator directly.
                    </li>
                </ul>
            </div>

            <div className="policy-section">
                <h2>Data Retention</h2>
                <p>
                    Please note that even after an account is deactivated or "deleted" from active view,
                    certain historical data (such as attendance logs, leave records, and payroll history)
                    may be retained in our secure database for a legally mandated period for audit and tax purposes.
                </p>
            </div>

            <div className="contact-box">
                <h3>Need Assistance?</h3>
                <p>
                    If you have questions about this policy or need to initiate a request regarding your data,
                    please contact your company's HR administrator.
                </p>
                <br />
                <p>
                    For technical support related to the app, you may contact: <br />
                    <strong>support@elitecraftuk.com</strong>
                </p>
            </div>

            <div className="policy-footer">
                &copy; {new Date().getFullYear()} EliteCraft HRMS. All rights reserved.
            </div>
        </div>
    );
};

export default AccountDeletionPolicy;
