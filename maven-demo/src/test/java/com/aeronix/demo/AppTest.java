package com.aeronix.demo;

import org.junit.Test;

import static org.junit.Assert.assertEquals;

public class AppTest {

    @Test
    public void testAdd() {
        App app = new App();
        assertEquals(5, app.add(2, 3));
    }

    @Test
    public void testAddPositiveNumbers() {
        App app = new App();
        assertEquals(15, app.add(10, 5));
    }

    @Test
    public void testAddNegativeNumbers() {
        App app = new App();
        assertEquals(-8, app.add(-5, -3));
    }

    @Test
    public void testAddPositiveAndNegative() {
        App app = new App();
        assertEquals(7, app.add(10, -3));
    }

    @Test
    public void testAddZero() {
        App app = new App();
        assertEquals(10, app.add(10, 0));
    }

    @Test
    public void testAddTwoZeros() {
        App app = new App();
        assertEquals(0, app.add(0, 0));
    }
}