const prefill = {
	c: `#include <stdio.h>

int main()
{
	int n = 0;
	printf("Enter the size of the array: ");
	scanf("%d", &n);
	int array[n];

	for (int i = 0; i < n; i++)
	{
		printf("Element %d: ", i);
		scanf("%d", &array[i]);
	}

	printf("\\nElements of the array are: ");
	for (int i = 0; i < n; i++)
		printf("%d ", array[i]);
	return 0;
}`,

	cpp: `#include <iostream>
using namespace std;

int main()
{
	int n;
	cout << "Enter an integer: ";
	cin >> n;
	cout << "The number is: " << n;
	return 0;
}`,

	cs: `public class Program
{
    public static void Main(string[] args)
    {
        System.Console.WriteLine("Hey there!");
    }
}`,

	java: `class HeyThere {
	public static void main(String[] args) {
		System.out.println("Hey there!"); 
	}
}`,

	py: `print('Hey there!')`,

	js: `console.log('Hey there!');`
}
