# epgfilter
Apply filters to an EPG file and serve a slim down version

# Quickstart

> [!IMPORTANT]
> You must configure required environment variables.

1. Configure required Environment variables: 
    - **FILTER_STARTS_WITH** - Your filter condition.
    - **EPG_URL_PATH** - The original EPG url, from your provider.
    - **GENERATOR_INFO_NAME** - The default ```generator-info-name``` attribute in your original EPG url TV node. Use this to mimic the original provider response.
1. EPG filter will run automatically on start and every 6 hours (configurable in ENV).
2. Call http://yourdomain:3000/epg.xml (configurable in ENV) to get filtered EPG.

# Environment Variables
| VARIABLE    | DEFAULT | DESCRIPTION |
| -------- | ------- | ------- |
| PORT  | 3000    | Default port for the server |
| FETCH_HOUR_INTERVAL  | 6    | Hours. How often the program will call the provider to get new EPG. |
| FILTER_STARTS_WITH  | ''    | Only catch channels with the provided prefix. for example, if the provider lists channels by countries with a prefix US: CNN, you can use the prefix 'US:' |
| EPG_URL_PATH  | ''    | The URL for your provider's original EPG file which will be filtered |
| API_EPG_RESULT_PATH  | '/epg.xml'    | Your filtered EPG URL path. Default will result in your EPG at: https://myserver.com/epg.xml |
| EPG_OUTPUT_FILE_PATH  | './filtered_epg.xml'    | Output filtered file path. |
| EPG_LANGUAGE  | 'en'    | Language tag for titles and descriptions. |
| GENERATOR_INFO_NAME  | ''    | The value of the "generator-info-name" attribute in the original EPG tv tag. |
| USE_LOCAL_FILE  | false    | When true reads EPG from a local file instead of a server |
| EPG_LOCAL_FILE  | ''    | If using USE_LOCAL_FILE you must also include a path to the file |
