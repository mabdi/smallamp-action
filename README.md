# SmallAmp Action

Use this action to run [SmallAmp](https://github.com/mabdi/small-amp/) on the Github Actions framework.

# How to use me

Look at our toy example project [SmallBank](https://github.com/mabdi/smalltalk-SmallBank).
You can Copy the workflow from [SmallAmpCI.yml](https://github.com/mabdi/smalltalk-SmallBank/blob/master/.github/workflows/SmallAmpCI.yml) and paste it in your project

## Tuning

The only thing that you may need to change is the number of parallel jobs.
Github actions supports up to 8 parallel jobs.

To set the number of parallel jobs, you need to change the lengh of the array in `jobs.TestAmplification.strategy.matrix.portion`.
The content of array is not important. Just the length is important. 
