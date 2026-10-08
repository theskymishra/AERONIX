package com.aeronix.demo;

public class App {

    // 1. Validate employee email
    public boolean isValidEmployeeEmail(String email) {
        return email != null && email.matches("^[A-Za-z0-9+_.-]+@aeronix\\.com$");
    }

    // 2. Validate employee name
    public boolean isValidEmployeeName(String name) {
        return name != null && !name.trim().isEmpty();
    }

    // 3. Check whether a job opening is active
    public boolean isJobOpeningActive(String status) {
        return "OPEN".equalsIgnoreCase(status);
    }

    // 4. Check whether a candidate can apply
    public boolean canApplyForJob(boolean jobOpen, boolean candidateEligible) {
        return jobOpen && candidateEligible;
    }

    // 5. Calculate salary after deduction
    public double calculateNetSalary(double salary, double deduction) {
        return salary - deduction;
    }

    // 6. Calculate attendance percentage
    public double calculateAttendancePercentage(int presentDays, int totalDays) {
        if (totalDays <= 0) {
            return 0.0;
        }

        return (presentDays * 100.0) / totalDays;
    }

    // 7. Validate leave request
    public boolean isValidLeaveRequest(int leaveDays, int availableLeave) {
        return leaveDays > 0 && leaveDays <= availableLeave;
    }

    // 8. Validate performance score
    public boolean isValidPerformanceScore(double score) {
        return score >= 0 && score <= 100;
    }

    // 9. Calculate goal completion percentage
    public double calculateGoalCompletion(int completed, int total) {
        if (total <= 0) {
            return 0.0;
        }

        return (completed * 100.0) / total;
    }

    // 10. Check whether a candidate is eligible based on experience
    public boolean isCandidateEligible(int experienceYears, int requiredYears) {
        return experienceYears >= requiredYears;
    }
}