/**
 * Student Utils Tests
 * 학생 유틸리티 함수 테스트
 */

import { parseStudentId, isValidStudentId, formatStudentId } from '../studentUtils';

// Test parseStudentId function
export function testParseStudentId() {
    console.log('🧪 Testing parseStudentId function...');
    
    // Valid cases
    const valid1 = parseStudentId('1301');
    console.log('Valid case 1301:', valid1);
    
    const valid2 = parseStudentId('6927');
    console.log('Valid case 6927:', valid2);
    
    // Invalid cases
    const invalid1 = parseStudentId('123'); // too short
    console.log('Invalid case 123:', invalid1);
    
    const invalid2 = parseStudentId('1355'); // number > 27
    console.log('Invalid case 1355:', invalid2);
    
    const invalid3 = parseStudentId('7301'); // grade > 6
    console.log('Invalid case 7301:', invalid3);
    
    const invalid4 = parseStudentId('1001'); // number = 0
    console.log('Invalid case 1001:', invalid4);
    
    return {
        valid1: isValidStudentId(valid1),
        valid2: isValidStudentId(valid2),
        invalid1: !isValidStudentId(invalid1),
        invalid2: !isValidStudentId(invalid2),
        invalid3: !isValidStudentId(invalid3),
        invalid4: !isValidStudentId(invalid4)
    };
}

// Test formatStudentId function
export function testFormatStudentId() {
    console.log('🧪 Testing formatStudentId function...');
    
    const test1 = formatStudentId('1301');
    const test2 = formatStudentId('130');
    const test3 = formatStudentId('13012'); // should be truncated
    const test4 = formatStudentId('1a3b0c1'); // should extract numbers only
    const test5 = formatStudentId('abc'); // should return null
    
    console.log('Format test results:', { test1, test2, test3, test4, test5 });
    
    return { test1, test2, test3, test4, test5 };
}

// Run all tests
export function runStudentUtilsTests() {
    console.log('🚀 Running Student Utils Tests');
    
    const parseResults = testParseStudentId();
    const formatResults = testFormatStudentId();
    
    const allPassed = Object.values(parseResults).every(result => result === true);
    
    console.log('✅ Parse tests results:', parseResults);
    console.log('✅ Format tests results:', formatResults);
    console.log(allPassed ? '🎉 All tests passed!' : '❌ Some tests failed');
    
    return { parseResults, formatResults, allPassed };
}