package com.aeronix.demo;

import org.junit.Test;

import static org.junit.Assert.assertEquals;

public class AppTest {

    @Test
    public void testAdd() {
        App app = new App();

        assertEquals(5, app.add(2, 3));
    }
}
