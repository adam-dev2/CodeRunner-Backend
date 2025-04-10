#include <iostream>
#include <vector>
using namespace std;

int main() {
    int vec[5];
    for(int i=0;i<5;i++) {
        int x;
        cout<<x<<endl;
        cin>>x;
        vec[i] = x;
    }
    for(int i=0;i<5;i++) {
        cout<<vec[i]<<" ";
    }
    return 0;
}