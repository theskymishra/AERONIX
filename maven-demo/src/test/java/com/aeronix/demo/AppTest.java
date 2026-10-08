package com.aeronix.demo;

import org.junit.Test;

import static org.junit.Assert.*;

public class AppTest {

    // =========================================================
    // 10 SUCCESS / POSITIVE TEST CASES
    // =========================================================

    @Test
    public void testValidEmployeeEmail() {
        App app = new App();

        assertTrue(
                app.isValidEmployeeEmail("employee@aeronix.com")
        );
    }

    @Test
    public void testValidEmployeeName() {
        App app = new App();

        assertTrue(
                app.isValidEmployeeName("Akash Mishra")
        );
    }

    @Test
    public void testOpenJobOpening() {
        App app = new App();

        assertTrue(
                app.isJobOpeningActive("OPEN")
        );
    }

    @Test
    public void testEligibleCandidateCanApply() {
        App app = new App();

        assertTrue(
                app.canApplyForJob(true, true)
        );
    }

    @Test
    public void testNetSalaryCalculation() {
        App app = new App();

        assertEquals(
                45000.0,
                app.calculateNetSalary(50000.0, 5000.0),
                0.01
        );
    }

    @Test
    public void testAttendancePercentage() {
        App app = new App();

        assertEquals(
                90.0,
                app.calculateAttendancePercentage(18, 20),
                0.01
        );
    }

    @Test
    public void testValidLeaveRequest() {
        App app = new App();

        assertTrue(
                app.isValidLeaveRequest(3, 10)
        );
    }

    @Test
    public void testValidPerformanceScore() {
        App app = new App();

        assertTrue(
                app.isValidPerformanceScore(85.5)
        );
    }

    @Test
    public void testGoalCompletionPercentage() {
        App app = new App();

        assertEquals(
                75.0,
                app.calculateGoalCompletion(3, 4),
                0.01
        );
    }

    @Test
    public void testCandidateExperienceEligibility() {
        App app = new App();

        assertTrue(
                app.isCandidateEligible(3, 2)
        );
    }


    // =========================================================
    // 5 FAILURE / NEGATIVE SCENARIO TEST CASES
    // =========================================================

    @Test
    public void testInvalidEmployeeEmail() {
        App app = new App();

        assertFalse(
                app.isValidEmployeeEmail("employee@gmail.com")
        );
    }

    @Test
    public void testClosedJobOpening() {
        App app = new App();

        assertFalse(
                app.isJobOpeningActive("CLOSED")
        );
    }

    @Test
    public void testIneligibleCandidateCannotApply() {
        App app = new App();

        assertFalse(
                app.canApplyForJob(true, false)
        );
    }

    @Test
    public void testInvalidLeaveRequest() {
        App app = new App();

        assertFalse(
                app.isValidLeaveRequest(12, 10)
        );
    }

    @Test
    public void testInvalidPerformanceScore() {
        App app = new App();

        assertFalse(
                app.isValidPerformanceScore(105)
        );
    }
}