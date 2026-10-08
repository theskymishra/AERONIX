pipeline {
    agent any
    tools {
        maven 'M3'
        jdk 'JDK21'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('API Tests') {
            steps {
                sh 'npm run --workspace=api test'
            }
        }

        stage('API Build') {
            steps {
                sh 'npm run --workspace=api build'
            }
        }

        stage('Web Build') {
            steps {
                sh 'npm run --workspace=web build'
            }
        }

        stage('Maven Build and Test') {
            steps {
                dir('maven-demo') {
                    sh 'mvn clean test'
                }
            }
        }
    }

    post {
        success {
            echo 'AERONIX CI PIPELINE PASSED SUCCESSFULLY!'
        }

        failure {
            echo 'AERONIX CI PIPELINE FAILED.'
        }
    }
}
